"""画像と問題の紐付けサービス"""
import logging
import uuid
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.question import Question
from app.models.question_image import QuestionImage
from app.services.question_service import get_question_hash
from app.services.image_matcher import ImageMatcherService
from app.services.image_storage import ImageStorage
from app.services.vlm_analyzer import VLMAnalyzer

logger = logging.getLogger(__name__)


async def link_images_by_semantic_matching(
    db: AsyncSession,
    questions: list[dict[str, Any]],
    image_index: dict[str, dict[str, Any]],
    vlm_analyzer: Optional[VLMAnalyzer],
    image_storage: Optional[ImageStorage],
) -> int:
    """セマンティックマッチングで画像を問題に紐付け

    image_refsベースの紐付けが失敗した問題に対して、
    画像キャプションと問題内容の類似度で画像を紐付ける。

    Args:
        db: データベースセッション
        questions: 抽出された問題リスト
        image_index: ファイル名→画像データの辞書
        vlm_analyzer: VLM解析器
        image_storage: 画像ストレージ

    Returns:
        紐付けられた画像数
    """
    if not image_index or not vlm_analyzer or not image_storage:
        return 0

    logger.info("Starting semantic matching for image linking...")

    # Step 1: 画像にまだ紐付いていない問題を取得
    questions_without_images: list[dict[str, Any]] = []
    for q in questions:
        # content_hashで問題を検索
        content_hash = get_question_hash(q["content"])
        result = await db.execute(
            select(Question)
            .options(selectinload(Question.images))
            .where(Question.content_hash == content_hash)
        )
        existing_q = result.scalar_one_or_none()
        if existing_q and len(existing_q.images) == 0:
            questions_without_images.append({
                "id": str(existing_q.id),
                "content": existing_q.content,
                "db_question": existing_q,
            })

    if not questions_without_images:
        logger.info("All questions already have images linked")
        return 0

    logger.info(f"Found {len(questions_without_images)} questions without images")

    # Step 2: 画像からキャプションを生成
    captions: list[dict[str, Any]] = []
    for filename, img_info in image_index.items():
        try:
            vlm_result = await vlm_analyzer.analyze(
                img_info["data"],
                detect_type=True,
                fallback_on_error=True,
            )
            if vlm_result and vlm_result.description:
                captions.append({
                    "filename": filename,
                    "caption": vlm_result.description,
                    "image_type": vlm_result.image_type,
                    "data": img_info["data"],
                })
                logger.debug(f"Generated caption for {filename}: {vlm_result.description[:50]}...")
        except Exception as e:
            logger.warning(f"Failed to generate caption for {filename}: {e}")
            continue

    if not captions:
        logger.warning("No captions generated for images")
        return 0

    logger.info(f"Generated {len(captions)} captions for images")

    # Step 3: セマンティックマッチング
    try:
        matcher = ImageMatcherService()
        matches = await matcher.match(
            questions=[{"id": q["id"], "content": q["content"]} for q in questions_without_images],
            captions=[{"caption": c["caption"], "xref": i, "page": 0} for i, c in enumerate(captions)],
            threshold=0.3,
            top_k=2,
        )
    except Exception as e:
        logger.warning(f"Semantic matching failed: {e}")
        return 0

    # Step 4: マッチ結果で画像を紐付け
    linked_count = 0
    for q_info in questions_without_images:
        question_id = q_info["id"]
        db_question = q_info["db_question"]

        if question_id not in matches:
            continue

        matched_images = matches[question_id]
        for pos, match in enumerate(matched_images):
            try:
                caption_idx = match["xref"]
                caption_info = captions[caption_idx]

                # 画像を保存
                img_info = image_storage.save(
                    image_data=caption_info["data"],
                    question_id=uuid.UUID(question_id),
                    position=pos,
                    alt_text=caption_info["caption"],
                    image_type=caption_info["image_type"],
                )

                # 既存の同一画像レコードをチェック
                existing_img = await db.execute(
                    select(QuestionImage).where(
                        QuestionImage.question_id == uuid.UUID(question_id),
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
                    question_id=uuid.UUID(question_id),
                    file_path=img_info.file_path,
                    alt_text=caption_info["caption"],
                    position=pos,
                    image_type=caption_info["image_type"],
                )
                db.add(question_image)
                linked_count += 1
                logger.info(
                    f"Linked image {caption_info['filename']} to question {question_id} "
                    f"(score: {match['score']:.2f})"
                )
            except Exception as e:
                logger.warning(f"Failed to link image to question {question_id}: {e}")
                continue

    if linked_count > 0:
        await db.commit()
        logger.info(f"Linked {linked_count} images via semantic matching")

    return linked_count


async def link_images_to_existing_question(
    db: AsyncSession,
    question: Question,
    image_refs: list[str],
    image_index: dict[str, dict[str, Any]],
    vlm_analyzer: VLMAnalyzer,
    image_storage: ImageStorage,
) -> int:
    """既存問題に画像を紐付け

    再インポート時に重複検出された問題に画像がない場合、
    image_refsに基づいて画像を紐付ける。

    Args:
        db: データベースセッション
        question: 既存の問題オブジェクト
        image_refs: 画像ファイル名のリスト
        image_index: ファイル名→画像データの辞書
        vlm_analyzer: VLM解析器
        image_storage: 画像ストレージ

    Returns:
        紐付けられた画像数
    """
    linked_count = 0
    for pos, img_filename in enumerate(image_refs):
        if img_filename not in image_index:
            logger.warning(
                f"Image not found: {img_filename} for existing question {question.id}"
            )
            continue

        img_info_data = image_index[img_filename]
        img_data = img_info_data["data"]

        try:
            vlm_result = await vlm_analyzer.analyze(
                img_data, detect_type=True, fallback_on_error=True,
            )

            alt_text = None
            image_type = "unknown"
            if vlm_result:
                alt_text = vlm_result.description
                image_type = vlm_result.image_type

            img_info = image_storage.save(
                image_data=img_data,
                question_id=question.id,
                position=pos,
                alt_text=alt_text,
                image_type=image_type,
            )

            # 既存の同一画像レコードをチェック
            existing_img = await db.execute(
                select(QuestionImage).where(
                    QuestionImage.question_id == question.id,
                    QuestionImage.file_path == img_info.file_path,
                )
            )
            if existing_img.scalar_one_or_none():
                logger.info(
                    f"Skipping duplicate image {img_info.file_path} "
                    f"for existing question {question.id}"
                )
                continue

            question_image = QuestionImage(
                id=img_info.id,
                question_id=question.id,
                file_path=img_info.file_path,
                alt_text=alt_text,
                position=pos,
                image_type=image_type,
            )
            db.add(question_image)
            linked_count += 1
            logger.info(
                f"Linked image {img_filename} to existing question {question.id}"
            )
        except Exception as e:
            logger.warning(f"Failed to link image {img_filename} to existing question: {e}")
            continue

    if linked_count > 0:
        await db.flush()
        logger.info(f"Linked {linked_count} images to existing question {question.id}")

    return linked_count
