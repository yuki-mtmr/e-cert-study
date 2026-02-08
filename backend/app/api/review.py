"""復習APIエンドポイント"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.review import ReviewItemResponse, ReviewStatsResponse
from app.services.review_service import (
    get_active_review_items,
    get_mastered_items,
    get_review_stats,
)

router = APIRouter(prefix="/api/review", tags=["review"])


@router.get("/items", response_model=list[ReviewItemResponse])
async def get_review_items(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ReviewItemResponse]:
    """アクティブな復習アイテムを取得"""
    items = await get_active_review_items(db, user_id)
    return [ReviewItemResponse.model_validate(item) for item in items]


@router.get("/mastered", response_model=list[ReviewItemResponse])
async def get_mastered(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ReviewItemResponse]:
    """習得済みアイテムを取得"""
    items = await get_mastered_items(db, user_id)
    return [ReviewItemResponse.model_validate(item) for item in items]


@router.get("/stats", response_model=ReviewStatsResponse)
async def get_stats(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> ReviewStatsResponse:
    """復習統計を取得"""
    stats = await get_review_stats(db, user_id)
    return ReviewStatsResponse(**stats)
