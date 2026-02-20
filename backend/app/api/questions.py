"""問題APIエンドポイント"""
import logging
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.answer import Answer
from app.models.category import Category
from app.models.question import Question
from app.models.question_image import QuestionImage
from app.schemas.question import QuestionCreate, QuestionResponse
from app.schemas.question_api import (
    AutoClassifyResponse,
    CategoryUpdateRequest,
    CategoryUpdateResponse,
    ImportResponse,
    RegenerateExplanationResponse,
    RegenerateExplanationsResponse,
)
from app.services.framework_detector import detect_framework
from app.services.image_linker import (
    link_images_by_semantic_matching,
    link_images_to_existing_question,
)
from app.services.image_storage import ImageStorage
from app.services.mineru_extractor import (
    MinerUExtractor,
    MinerUError,
    MinerUNotAvailableError,
)
from app.services.pdf_extractor import (
    PDFExtractionError,
    extract_questions_from_text,
    extract_text_from_pdf,
)
from app.services.question_service import (
    DEFAULT_CATEGORY_NAME,
    create_question_service,
    get_or_create_default_category,
    get_question_by_id_service,
    get_question_hash,
    get_questions_service,
    get_random_question_service,
    resolve_category_id,
)
from app.services.vlm_analyzer import VLMAnalyzer
from app.services.explanation_generator import (
    generate_explanation,
    generate_explanations_batch,
    is_already_formatted,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("", response_model=list[QuestionResponse])
async def get_questions(
    category_id: Optional[uuid.UUID] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[Question]:
    """問題一覧を取得"""
    return await get_questions_service(db, category_id, limit)


@router.get("/random", response_model=QuestionResponse)
async def get_random_question(
    category_id: Optional[uuid.UUID] = None,
    category_ids: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Question:
    """ランダムな問題を取得

    Args:
        category_id: 単一のカテゴリID（後方互換性）
        category_ids: カンマ区切りの複数カテゴリID（例: "uuid1,uuid2,uuid3"）
    """
    # category_idsをパース
    parsed_category_ids: Optional[list[uuid.UUID]] = None
    if category_ids:
        try:
            parsed_category_ids = [
                uuid.UUID(cid.strip())
                for cid in category_ids.split(",")
                if cid.strip()
            ]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid UUID format in category_ids",
            )

    question = await get_random_question_service(
        db,
        category_id=category_id,
        category_ids=parsed_category_ids,
    )
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found",
        )
    return question


@router.get("/smart", response_model=QuestionResponse)
async def get_smart_question(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> Question:
    """苦手分野を優先してスマートに問題を出題

    アルゴリズム:
    1. ユーザーの苦手カテゴリ（正解率が低い）を取得
    2. 苦手カテゴリがあれば、そこから優先的に出題
    3. 最近回答した問題は除外
    4. 苦手カテゴリがなければランダム出題
    """
    # 苦手カテゴリを取得（正解率50%未満、最低5問以上回答）
    from sqlalchemy import Integer, cast as sql_cast

    weak_areas_result = await db.execute(
        select(
            Category.id,
            Category.name,
            func.count(Answer.id).label("total"),
            func.sum(sql_cast(Answer.is_correct, Integer)).label("correct"),
            (func.sum(sql_cast(Answer.is_correct, Integer)) * 100.0 / func.count(Answer.id)).label("accuracy"),
        )
        .join(Question, Question.category_id == Category.id)
        .join(Answer, Answer.question_id == Question.id)
        .where(Answer.user_id == user_id)
        .group_by(Category.id, Category.name)
        .having(func.count(Answer.id) >= 5)
        .having((func.sum(sql_cast(Answer.is_correct, Integer)) * 100.0 / func.count(Answer.id)) < 50)
        .order_by("accuracy")
        .limit(3)
    )
    weak_areas = weak_areas_result.all()

    # 最近回答した問題IDを取得（直近20問）
    recent_result = await db.execute(
        select(Answer.question_id)
        .where(Answer.user_id == user_id)
        .order_by(Answer.answered_at.desc())
        .limit(20)
    )
    recent_question_ids = [row for row in recent_result.scalars().all()]

    # 出題クエリを構築
    query = select(Question).options(selectinload(Question.images))

    # TensorFlow専用問題を除外
    query = query.where(
        (Question.framework.is_(None)) | (Question.framework != "tensorflow")
    )

    # 最近の問題を除外
    if recent_question_ids:
        query = query.where(Question.id.notin_(recent_question_ids))

    # 苦手カテゴリがあればそこから優先出題
    if weak_areas:
        weak_category_ids = [area[0] for area in weak_areas]
        query = query.where(Question.category_id.in_(weak_category_ids))

    # ランダムに1問取得
    query = query.order_by(func.random()).limit(1)
    result = await db.execute(query)
    question = result.scalar_one_or_none()

    # 苦手カテゴリから問題が見つからない場合、全体からランダム
    if not question:
        fallback_query = select(Question).options(selectinload(Question.images))
        # TensorFlow専用問題を除外
        fallback_query = fallback_query.where(
            (Question.framework.is_(None))
            | (Question.framework != "tensorflow")
        )
        if recent_question_ids:
            fallback_query = fallback_query.where(Question.id.notin_(recent_question_ids))
        fallback_query = fallback_query.order_by(func.random()).limit(1)
        result = await db.execute(fallback_query)
        question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found",
        )

    return question


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Question:
    """問題詳細を取得"""
    question = await get_question_by_id_service(db, question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )
    return question


@router.post("", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
) -> Question:
    """問題を作成"""
    return await create_question_service(db, question_data)


@router.post("/import", response_model=ImportResponse)
async def import_questions_from_pdf(
    file: UploadFile = File(...),
    save_to_db: bool = True,
    category_id: Optional[uuid.UUID] = None,
    use_mineru: bool = True,
    db: AsyncSession = Depends(get_db),
) -> ImportResponse:
    """PDFから問題を抽出してDBに保存

    MinerUが利用可能な場合はレイアウト解析で画像も抽出し、
    VLMで画像を解析してalt_textを生成する。

    Args:
        file: PDFファイル
        save_to_db: DBに保存するかどうか（デフォルト: True）
        category_id: 保存先のカテゴリID（オプション）
        use_mineru: MinerUを使用するか（デフォルト: True）

    Note:
        本番環境ではClaude CLIが利用できないため、この機能は無効化されています。
    """
    # 本番環境ではインポート機能を無効化
    from app.core.config import settings

    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error_code": "IMPORT_DISABLED_IN_PRODUCTION",
                "message": "PDFインポート機能は本番環境では利用できません",
                "description": "この機能はClaude CLIを使用するため、ローカル環境でのみ実行可能です。ローカル環境でPDFをインポートしてください。",
                "hint": "ローカルで `cd backend && python -m uvicorn app.main:app` を実行し、そこからインポートしてください。",
            },
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF file is required",
        )

    try:
        content = await file.read()
        logger.info(f"Received PDF file: {file.filename}, size: {len(content)} bytes")

        # 画像データをファイル名でインデックス化
        image_index: dict[str, dict[str, Any]] = {}
        text = ""

        # MinerUでレイアウト解析を試みる
        if use_mineru:
            try:
                extractor = MinerUExtractor()
                result = await extractor.extract(content, fallback_on_error=True)
                text = result.markdown
                # ファイル名でインデックス化
                for img in result.images:
                    if img.filename in image_index:
                        logger.warning(
                            f"Image filename collision: {img.filename} "
                            f"(page {img.page_number}, pos {img.position})"
                        )
                    image_index[img.filename] = {
                        "data": img.data,
                        "position": img.position,
                    }
                logger.info(
                    f"MinerU extracted: {len(text)} chars, {len(image_index)} images"
                )
                if image_index:
                    logger.info(f"Image filenames: {list(image_index.keys())}")
            except (MinerUError, MinerUNotAvailableError) as e:
                logger.warning(f"MinerU failed, falling back to pypdf: {e}")
                text = await extract_text_from_pdf(content)
        else:
            text = await extract_text_from_pdf(content)

        logger.info(f"Extracted text length: {len(text)} chars")

        if not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from PDF",
            )

        # AIで問題を抽出
        logger.info("Calling Claude CLI for question extraction...")
        questions = await extract_questions_from_text(
            text,
            source=file.filename or "PDF Import",
            category_id=category_id,
        )
        logger.info(f"Extracted {len(questions)} questions from PDF")

        # 画像参照の統計をログ出力
        questions_with_refs = sum(1 for q in questions if q.get("image_refs"))
        all_refs = [ref for q in questions for ref in q.get("image_refs", [])]
        logger.info(f"Questions with image_refs: {questions_with_refs}, Total refs: {len(all_refs)}")
        if all_refs:
            logger.info(f"Sample image_refs: {all_refs[:5]}")

        # DBに保存
        saved_count = 0
        if save_to_db and questions:
            # デフォルトカテゴリを準備
            default_category_id = category_id
            if not default_category_id:
                default_category_id = await get_or_create_default_category(db)
                logger.info(f"Using default category: {DEFAULT_CATEGORY_NAME}")

            # カテゴリ名→IDマッピングを構築（per-questionカテゴリ振り分け用）
            cat_result = await db.execute(select(Category))
            all_categories = list(cat_result.scalars().all())
            category_map = {c.name: c.id for c in all_categories}

            # 画像解析・保存の準備
            vlm_analyzer = VLMAnalyzer() if image_index else None
            image_storage = ImageStorage() if image_index else None

            skipped_count = 0
            for q in questions:
                try:
                    # 重複チェック
                    content_hash = get_question_hash(q["content"])
                    existing = await db.execute(
                        select(Question)
                        .options(selectinload(Question.images))
                        .where(Question.content_hash == content_hash)
                    )
                    existing_q = existing.scalar_one_or_none()
                    if existing_q:
                        # 既存問題に画像がなく、新規importに画像参照がある場合は画像を追加
                        image_refs = q.get("image_refs", [])
                        if len(existing_q.images) == 0 and image_refs and image_index and vlm_analyzer and image_storage:
                            await link_images_to_existing_question(
                                db, existing_q, image_refs, image_index, vlm_analyzer, image_storage,
                            )
                        logger.info(f"Skipping duplicate question: {content_hash[:8]}...")
                        skipped_count += 1
                        continue

                    # per-questionカテゴリ振り分け
                    q_category_id = resolve_category_id(
                        q.get("category"), category_map
                    )
                    effective_category_id = q_category_id or default_category_id

                    question_id = uuid.uuid4()
                    framework = detect_framework(
                        q["content"], q["choices"]
                    )
                    question = Question(
                        id=question_id,
                        category_id=effective_category_id,
                        content=q["content"],
                        choices=q["choices"],
                        correct_answer=q["correct_answer"],
                        explanation=q.get("explanation", ""),
                        difficulty=q.get("difficulty", 3),
                        source=q.get("source", file.filename),
                        content_type=q.get("content_type", "plain"),
                        content_hash=content_hash,
                        framework=framework,
                        topic=q.get("topic"),
                    )
                    db.add(question)

                    # 問題に関連する画像を紐付け（image_refsに基づく）
                    image_refs = q.get("image_refs", [])
                    images_linked = 0
                    if image_refs:
                        logger.info(f"Question has image_refs: {image_refs}")
                    if image_refs and image_index and vlm_analyzer and image_storage:
                        for pos, img_filename in enumerate(image_refs):
                            if img_filename not in image_index:
                                logger.warning(
                                    f"Image not found: {img_filename} for question {question_id}"
                                )
                                continue

                            img_info_data = image_index[img_filename]
                            img_data = img_info_data["data"]

                            try:
                                # VLMで画像解析（タイムアウト時はNone）
                                vlm_result = await vlm_analyzer.analyze(
                                    img_data,
                                    detect_type=True,
                                    fallback_on_error=True,
                                )

                                alt_text = None
                                image_type = "unknown"
                                if vlm_result:
                                    alt_text = vlm_result.description
                                    image_type = vlm_result.image_type

                                # 画像をファイルに保存
                                img_info = image_storage.save(
                                    image_data=img_data,
                                    question_id=question_id,
                                    position=pos,
                                    alt_text=alt_text,
                                    image_type=image_type,
                                )

                                # 既存の同一画像レコードをチェック
                                existing_img = await db.execute(
                                    select(QuestionImage).where(
                                        QuestionImage.question_id == question_id,
                                        QuestionImage.file_path == img_info.file_path,
                                    )
                                )
                                if existing_img.scalar_one_or_none():
                                    logger.info(
                                        f"Skipping duplicate image {img_info.file_path} "
                                        f"for question {question_id}"
                                    )
                                    continue

                                # QuestionImageレコード作成
                                question_image = QuestionImage(
                                    id=img_info.id,
                                    question_id=question_id,
                                    file_path=img_info.file_path,
                                    alt_text=alt_text,
                                    position=pos,
                                    image_type=image_type,
                                )
                                db.add(question_image)
                                images_linked += 1
                                logger.info(
                                    f"Saved image {img_filename} for question {question_id}"
                                )
                            except Exception as img_e:
                                logger.warning(f"Failed to process image {img_filename}: {img_e}")
                                continue

                    saved_count += 1
                except Exception as e:
                    logger.warning(f"Failed to save question: {e}")
                    continue

            await db.commit()
            if skipped_count > 0:
                logger.info(f"Skipped {skipped_count} duplicate questions")
            logger.info(f"Saved {saved_count} questions to database")

            # Phase 2: セマンティックマッチングによる画像紐付け
            if image_index and saved_count > 0:
                await link_images_by_semantic_matching(
                    db=db,
                    questions=questions,
                    image_index=image_index,
                    vlm_analyzer=vlm_analyzer,
                    image_storage=image_storage,
                )

        # 未参照画像の警告ログ
        if image_index:
            all_refs_set = set(
                ref for q in questions for ref in q.get("image_refs", [])
            )
            unreferenced = set(image_index.keys()) - all_refs_set
            if unreferenced:
                logger.warning(
                    f"Unreferenced images ({len(unreferenced)}): "
                    f"{sorted(unreferenced)[:10]}"
                )

        # デバッグ情報を収集
        questions_with_refs = sum(1 for q in questions if q.get("image_refs"))
        all_refs = [ref for q in questions for ref in q.get("image_refs", [])]

        return ImportResponse(
            questions=questions,
            count=len(questions),
            saved_count=saved_count,
            extracted_images=len(image_index),
            image_filenames=list(image_index.keys())[:10],
            questions_with_refs=questions_with_refs,
            sample_refs=all_refs[:10],
        )

    except PDFExtractionError as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error processing PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {e}",
        )


@router.get("/{question_id}/images/{image_id}")
async def get_question_image(
    question_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """問題に紐づく画像を取得

    Args:
        question_id: 問題ID
        image_id: 画像ID
    """
    result = await db.execute(
        select(QuestionImage)
        .where(QuestionImage.question_id == question_id)
        .where(QuestionImage.id == image_id)
    )
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # URL（Supabase Storage等）の場合はリダイレクト
    if image.file_path.startswith(("http://", "https://")):
        return RedirectResponse(url=image.file_path)

    # ローカルファイルの場合は従来通りFileResponse
    file_path = Path(image.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found",
        )

    # MIMEタイプを決定
    suffix = file_path.suffix.lower()
    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
    )


# キャッシュディレクトリ
CACHE_DIR = Path(__file__).parent.parent.parent / ".cache" / "pdf_extractions"


@router.delete("/all")
async def delete_all_questions(
    confirm: str = Query(..., description="確認トークン: 'DELETE_ALL_QUESTIONS'と入力"),
    clear_cache: bool = False,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """全問題を削除

    Args:
        confirm: 確認トークン（'DELETE_ALL_QUESTIONS'と一致する必要がある）
        clear_cache: キャッシュもクリアするか
        db: DBセッション

    Returns:
        削除件数とキャッシュクリア結果

    Raises:
        HTTPException: 本番環境での実行、または確認トークンが不正な場合
    """
    # 本番環境では全削除を禁止
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="本番環境では全削除は禁止されています",
        )

    # 確認トークンの検証
    if confirm != "DELETE_ALL_QUESTIONS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="確認トークンが一致しません。'DELETE_ALL_QUESTIONS'と入力してください。",
        )

    # 問題数をカウント
    count_result = await db.execute(select(func.count(Question.id)))
    question_count = count_result.scalar() or 0

    # 画像ファイルを削除
    image_result = await db.execute(select(QuestionImage))
    images = image_result.scalars().all()
    deleted_files = 0
    for img in images:
        try:
            file_path = Path(img.file_path)
            if file_path.exists():
                file_path.unlink()
                deleted_files += 1
        except Exception as e:
            logger.warning(f"Failed to delete image file {img.file_path}: {e}")

    # 関連レコードを削除（外部キー制約の順序で）
    await db.execute(Answer.__table__.delete())
    await db.execute(QuestionImage.__table__.delete())
    await db.execute(Question.__table__.delete())

    await db.commit()

    # キャッシュクリア
    cache_cleared = False
    if clear_cache and CACHE_DIR.exists():
        try:
            import shutil
            shutil.rmtree(CACHE_DIR)
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            cache_cleared = True
            logger.info("Cache cleared")
        except Exception as e:
            logger.warning(f"Failed to clear cache: {e}")

    logger.info(f"Deleted {question_count} questions, {deleted_files} image files")

    return {
        "deleted_count": question_count,
        "deleted_image_files": deleted_files,
        "cache_cleared": cache_cleared,
    }


@router.patch("/{question_id}/category", response_model=CategoryUpdateResponse)
async def update_question_category(
    question_id: uuid.UUID,
    request: CategoryUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> CategoryUpdateResponse:
    """問題のカテゴリを更新"""
    # 問題を取得
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    # カテゴリを更新
    question.category_id = request.category_id
    await db.commit()

    return CategoryUpdateResponse(
        id=question.id,
        category_id=question.category_id,
        message="カテゴリを更新しました",
    )


@router.post("/auto-classify", response_model=AutoClassifyResponse)
async def auto_classify_questions(
    dry_run: bool = False,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> AutoClassifyResponse:
    """未分類問題をAIで一括分類

    Args:
        dry_run: Trueの場合、実際の更新は行わず分類結果のみ返す
        limit: 一度に処理する問題数
    """
    from app.services.category_classifier import classify_question

    # 「未分類」カテゴリのIDを取得
    result = await db.execute(
        select(Category).where(Category.name == DEFAULT_CATEGORY_NAME)
    )
    uncategorized = result.scalar_one_or_none()

    if not uncategorized:
        return AutoClassifyResponse(
            total=0,
            classified=0,
            failed=0,
            results=[],
        )

    # 未分類の問題を取得
    result = await db.execute(
        select(Question)
        .where(Question.category_id == uncategorized.id)
        .limit(limit)
    )
    questions = list(result.scalars().all())

    total = len(questions)
    classified = 0
    failed = 0
    results: list[dict[str, Any]] = []

    # 全カテゴリを名前→IDでマッピング
    cat_result = await db.execute(select(Category))
    all_categories = list(cat_result.scalars().all())
    category_map = {c.name: c.id for c in all_categories}

    for question in questions:
        try:
            # AIで分類
            category_name = await classify_question(
                content=question.content,
                choices=question.choices,
            )

            if category_name and category_name in category_map:
                new_category_id = category_map[category_name]

                if not dry_run:
                    question.category_id = new_category_id

                classified += 1
                results.append({
                    "question_id": str(question.id),
                    "content_preview": question.content[:50] + "...",
                    "category": category_name,
                    "status": "classified",
                })
            else:
                failed += 1
                results.append({
                    "question_id": str(question.id),
                    "content_preview": question.content[:50] + "...",
                    "category": category_name,
                    "status": "unknown_category",
                })

        except Exception as e:
            logger.error(f"Failed to classify question {question.id}: {e}")
            failed += 1
            results.append({
                "question_id": str(question.id),
                "content_preview": question.content[:50] + "...",
                "error": str(e),
                "status": "error",
            })

    if not dry_run:
        await db.commit()

    return AutoClassifyResponse(
        total=total,
        classified=classified,
        failed=failed,
        results=results,
    )


@router.post("/{question_id}/regenerate-explanation", response_model=RegenerateExplanationResponse)
async def regenerate_explanation_single(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> RegenerateExplanationResponse:
    """個別問題の解説を再生成

    Args:
        question_id: 問題ID
    """
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="問題が見つかりません",
        )

    new_explanation = await generate_explanation(
        content=question.content,
        choices=question.choices,
        correct_answer=question.correct_answer,
    )

    question.explanation = new_explanation
    await db.commit()

    return RegenerateExplanationResponse(
        question_id=str(question.id),
        explanation=new_explanation,
        status="success",
    )


@router.post("/regenerate-explanations", response_model=RegenerateExplanationsResponse)
async def regenerate_explanations_bulk(
    dry_run: bool = False,
    limit: int = 100,
    category_id: Optional[uuid.UUID] = None,
    skip_formatted: bool = True,
    concurrency: int = 3,
    db: AsyncSession = Depends(get_db),
) -> RegenerateExplanationsResponse:
    """一括で問題の解説を再生成（並列バッチ処理）

    Args:
        dry_run: Trueの場合、実際の更新は行わず再生成結果のみ返す
        limit: 一度に処理する問題数
        category_id: 対象カテゴリID（指定なしで全問題）
        skip_formatted: Trueの場合、新フォーマット済みの解説をスキップ
        concurrency: 同時実行数（デフォルト: 3）
    """
    query = select(Question)
    if category_id:
        query = query.where(Question.category_id == category_id)
    query = query.limit(limit)

    result = await db.execute(query)
    questions = list(result.scalars().all())

    total = len(questions)
    skipped = 0

    # フォーマット済みの問題をフィルタリング
    if skip_formatted:
        questions_to_process = []
        for q in questions:
            if is_already_formatted(q.explanation):
                skipped += 1
            else:
                questions_to_process.append(q)
    else:
        questions_to_process = questions

    # バッチ処理で並列生成
    batch_results = await generate_explanations_batch(
        questions_to_process, concurrency=concurrency
    )

    # 結果を集計
    regenerated = 0
    failed = 0
    results: list[dict[str, Any]] = []

    # question_id → questionオブジェクトのマッピング
    question_map = {str(q.id): q for q in questions_to_process}

    for br in batch_results:
        q_id = br["question_id"]
        if br["status"] == "success":
            if not dry_run:
                q_obj = question_map.get(q_id)
                if q_obj:
                    q_obj.explanation = br["explanation"]
            regenerated += 1
            results.append({
                "question_id": q_id,
                "content_preview": question_map[q_id].content[:50] + "..." if q_id in question_map else "",
                "status": "regenerated",
            })
        else:
            failed += 1
            results.append({
                "question_id": q_id,
                "content_preview": question_map[q_id].content[:50] + "..." if q_id in question_map else "",
                "error": br.get("error", "Unknown error"),
                "status": "error",
            })

    if not dry_run:
        await db.commit()

    return RegenerateExplanationsResponse(
        total=total,
        regenerated=regenerated,
        failed=failed,
        skipped=skipped,
        results=results,
    )
