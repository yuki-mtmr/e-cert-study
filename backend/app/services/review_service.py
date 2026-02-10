"""復習アイテム管理サービス

間違えた問題の追跡と習得管理のコアロジック。
- 不正解 → review_item作成(or既存ならcorrect_countリセット)
- 正解 + active状態 → correct_count + 1
- correct_count >= MASTERY_THRESHOLD → status="mastered"
- mastered後に不正解 → 再活性化
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mock_exam import MockExam
from app.models.review_item import ReviewItem

# 習得に必要な連続正解数
MASTERY_THRESHOLD = 3


async def handle_incorrect_answer(
    db: AsyncSession,
    question_id: uuid.UUID,
    user_id: str,
) -> ReviewItem:
    """不正解時の処理

    - 新規: review_item作成
    - 既存active: correct_countを0にリセット
    - 既存mastered: 再活性化(status="active", correct_count=0)
    """
    now = datetime.now()

    result = await db.execute(
        select(ReviewItem).where(
            ReviewItem.question_id == question_id,
            ReviewItem.user_id == user_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing is None:
        item = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=0,
            status="active",
            first_wrong_at=now,
            last_answered_at=now,
        )
        db.add(item)
        return item

    existing.correct_count = 0
    existing.status = "active"
    existing.mastered_at = None
    existing.last_answered_at = now
    return existing


async def handle_correct_answer(
    db: AsyncSession,
    question_id: uuid.UUID,
    user_id: str,
) -> Optional[ReviewItem]:
    """正解時の処理

    - active状態のアイテムがあればcorrect_count+1
    - 閾値到達でmastered化
    - アイテムがなければNone
    """
    now = datetime.now()

    result = await db.execute(
        select(ReviewItem).where(
            ReviewItem.question_id == question_id,
            ReviewItem.user_id == user_id,
            ReviewItem.status == "active",
        )
    )
    existing = result.scalar_one_or_none()

    if existing is None:
        return None

    existing.correct_count += 1
    existing.last_answered_at = now

    if existing.correct_count >= MASTERY_THRESHOLD:
        existing.status = "mastered"
        existing.mastered_at = now

    return existing


async def update_review_on_answer(
    db: AsyncSession,
    question_id: uuid.UUID,
    user_id: str,
    is_correct: bool,
) -> Optional[ReviewItem]:
    """回答に基づいて復習アイテムを更新する統合関数"""
    if is_correct:
        return await handle_correct_answer(db, question_id, user_id)
    else:
        return await handle_incorrect_answer(db, question_id, user_id)


async def get_active_review_items(
    db: AsyncSession,
    user_id: str,
) -> list[ReviewItem]:
    """ユーザーのactive復習アイテムを取得"""
    result = await db.execute(
        select(ReviewItem)
        .where(
            ReviewItem.user_id == user_id,
            ReviewItem.status == "active",
        )
        .order_by(ReviewItem.last_answered_at.asc())
    )
    return list(result.scalars().all())


async def get_mastered_items(
    db: AsyncSession,
    user_id: str,
) -> list[ReviewItem]:
    """ユーザーの習得済みアイテムを取得"""
    result = await db.execute(
        select(ReviewItem)
        .where(
            ReviewItem.user_id == user_id,
            ReviewItem.status == "mastered",
        )
        .order_by(ReviewItem.mastered_at.desc())
    )
    return list(result.scalars().all())


async def get_review_stats(
    db: AsyncSession,
    user_id: str,
) -> dict[str, int]:
    """復習統計を取得"""
    active_result = await db.execute(
        select(func.count(ReviewItem.id)).where(
            ReviewItem.user_id == user_id,
            ReviewItem.status == "active",
        )
    )
    active_count = active_result.scalar() or 0

    mastered_result = await db.execute(
        select(func.count(ReviewItem.id)).where(
            ReviewItem.user_id == user_id,
            ReviewItem.status == "mastered",
        )
    )
    mastered_count = mastered_result.scalar() or 0

    return {
        "active_count": active_count,
        "mastered_count": mastered_count,
        "total_count": active_count + mastered_count,
    }


async def get_review_items_with_details(
    db: AsyncSession,
    user_id: str,
    status_filter: Optional[str] = None,
) -> list[dict]:
    """復習アイテムを問題内容・カテゴリ名と共に取得する

    N+1回避のため selectinload で question をプリフェッチ。
    """
    from sqlalchemy.orm import selectinload
    from app.models.question import Question

    query = (
        select(ReviewItem)
        .options(
            selectinload(ReviewItem.question).selectinload(Question.category)
        )
        .where(ReviewItem.user_id == user_id)
    )

    if status_filter:
        query = query.where(ReviewItem.status == status_filter)

    query = query.order_by(ReviewItem.last_answered_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    details = []
    for item in items:
        content = item.question.content if item.question else ""
        # 100文字に切り詰め
        truncated = content[:100] if len(content) > 100 else content

        category_name = None
        if item.question and hasattr(item.question, "category") and item.question.category:
            category_name = item.question.category.name

        details.append({
            "id": item.id,
            "question_id": item.question_id,
            "user_id": item.user_id,
            "correct_count": item.correct_count,
            "status": item.status,
            "first_wrong_at": item.first_wrong_at,
            "last_answered_at": item.last_answered_at,
            "mastered_at": item.mastered_at,
            "question_content": truncated,
            "question_category_name": category_name,
        })

    return details


async def backfill_review_items_for_user(
    db: AsyncSession,
    user_id: str,
) -> dict[str, int]:
    """既存の完了済み模試から復習アイテムを遡及的に作成する

    update_review_on_answer は冪等なので、2回実行しても安全。
    """
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(MockExam)
        .options(selectinload(MockExam.answers))
        .where(
            MockExam.user_id == user_id,
            MockExam.status == "finished",
        )
    )
    exams = result.scalars().all()

    items_created = 0
    for exam in exams:
        for answer in exam.answers:
            if answer.is_correct is not None:
                item = await update_review_on_answer(
                    db, answer.question_id, user_id, answer.is_correct
                )
                if item is not None:
                    items_created += 1

    return {
        "exams_processed": len(exams),
        "items_created": items_created,
    }
