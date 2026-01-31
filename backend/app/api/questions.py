"""問題APIエンドポイント"""
import logging
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.answer import Answer
from app.models.category import Category
from app.models.question import Question
from app.models.question_image import QuestionImage
from app.schemas.question import QuestionCreate, QuestionResponse
from app.services.pdf_extractor import (
    PDFExtractionError,
    extract_questions_from_text,
    extract_text_from_pdf,
)
from app.services.mineru_extractor import (
    MinerUExtractor,
    MinerUError,
    MinerUNotAvailableError,
)
from app.services.vlm_analyzer import VLMAnalyzer
from app.services.image_storage import ImageStorage

router = APIRouter(prefix="/api/questions", tags=["questions"])

# デフォルトカテゴリ名
DEFAULT_CATEGORY_NAME = "未分類"


async def get_or_create_default_category(db: AsyncSession) -> uuid.UUID:
    """デフォルトカテゴリを取得または作成

    「未分類」カテゴリが存在しない場合は新規作成する。

    Args:
        db: データベースセッション

    Returns:
        デフォルトカテゴリのID
    """
    result = await db.execute(
        select(Category).where(Category.name == DEFAULT_CATEGORY_NAME)
    )
    category = result.scalar_one_or_none()

    if not category:
        category = Category(id=uuid.uuid4(), name=DEFAULT_CATEGORY_NAME)
        db.add(category)
        await db.flush()

    return category.id


class ImportResponse(BaseModel):
    """PDFインポートレスポンス"""
    questions: list[dict[str, Any]]
    count: int
    saved_count: int = 0  # DBに保存された問題数


async def get_questions_service(
    db: AsyncSession,
    category_id: Optional[uuid.UUID] = None,
    limit: int = 100,
) -> list[Question]:
    """問題一覧を取得するサービス"""
    query = select(Question).options(selectinload(Question.images))
    if category_id:
        query = query.where(Question.category_id == category_id)
    query = query.limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_question_by_id_service(
    db: AsyncSession,
    question_id: uuid.UUID,
) -> Optional[Question]:
    """IDで問題を取得するサービス"""
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.images))
        .where(Question.id == question_id)
    )
    return result.scalar_one_or_none()


async def get_random_question_service(
    db: AsyncSession,
    category_id: Optional[uuid.UUID] = None,
) -> Optional[Question]:
    """ランダムな問題を取得するサービス"""
    query = select(Question).options(selectinload(Question.images))
    if category_id:
        query = query.where(Question.category_id == category_id)
    query = query.order_by(func.random()).limit(1)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_question_service(
    db: AsyncSession,
    question_data: QuestionCreate,
) -> Question:
    """問題を作成するサービス"""
    question = Question(
        id=uuid.uuid4(),
        category_id=question_data.category_id,
        content=question_data.content,
        choices=question_data.choices,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation,
        difficulty=question_data.difficulty,
        source=question_data.source,
        content_type=question_data.content_type,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


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
    db: AsyncSession = Depends(get_db),
) -> Question:
    """ランダムな問題を取得"""
    question = await get_random_question_service(db, category_id)
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
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF file is required",
        )

    try:
        content = await file.read()
        logger.info(f"Received PDF file: {file.filename}, size: {len(content)} bytes")

        extracted_images: list[tuple[bytes, int]] = []
        text = ""

        # MinerUでレイアウト解析を試みる
        if use_mineru:
            try:
                extractor = MinerUExtractor()
                result = await extractor.extract(content, fallback_on_error=True)
                text = result.markdown
                extracted_images = [
                    (img.data, img.position) for img in result.images
                ]
                logger.info(
                    f"MinerU extracted: {len(text)} chars, {len(extracted_images)} images"
                )
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

        # DBに保存
        saved_count = 0
        if save_to_db and questions:
            # category_idが未指定の場合はデフォルトカテゴリを使用
            effective_category_id = category_id
            if not effective_category_id:
                effective_category_id = await get_or_create_default_category(db)
                logger.info(f"Using default category: {DEFAULT_CATEGORY_NAME}")

            # 画像解析・保存の準備
            vlm_analyzer = VLMAnalyzer() if extracted_images else None
            image_storage = ImageStorage() if extracted_images else None

            for q in questions:
                try:
                    question_id = uuid.uuid4()
                    question = Question(
                        id=question_id,
                        category_id=effective_category_id,
                        content=q["content"],
                        choices=q["choices"],
                        correct_answer=q["correct_answer"],
                        explanation=q.get("explanation", ""),
                        difficulty=q.get("difficulty", 3),
                        source=q.get("source", file.filename),
                        content_type="markdown" if extracted_images else "plain",
                    )
                    db.add(question)

                    # 画像を解析して保存
                    if extracted_images and vlm_analyzer and image_storage:
                        for img_data, position in extracted_images:
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
                                    position=position,
                                    alt_text=alt_text,
                                    image_type=image_type,
                                )

                                # QuestionImageレコード作成
                                question_image = QuestionImage(
                                    id=img_info.id,
                                    question_id=question_id,
                                    file_path=img_info.file_path,
                                    alt_text=alt_text,
                                    position=position,
                                    image_type=image_type,
                                )
                                db.add(question_image)
                                logger.info(
                                    f"Saved image for question {question_id}: {img_info.file_path}"
                                )
                            except Exception as img_e:
                                logger.warning(f"Failed to process image: {img_e}")
                                continue

                    saved_count += 1
                except Exception as e:
                    logger.warning(f"Failed to save question: {e}")
                    continue

            await db.commit()
            logger.info(f"Saved {saved_count} questions to database")

        return ImportResponse(
            questions=questions,
            count=len(questions),
            saved_count=saved_count,
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
) -> FileResponse:
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
