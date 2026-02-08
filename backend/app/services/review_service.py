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

from app.models.review_item import ReviewItem

# 習得に必要な連続正解数
MASTERY_THRESHOLD = 10


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
