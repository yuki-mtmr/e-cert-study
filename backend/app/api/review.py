"""復習APIエンドポイント"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.review import (
    BackfillRequest,
    BackfillResponse,
    ReviewItemDetailResponse,
    ReviewItemResponse,
    ReviewStatsResponse,
)
from app.services.review_service import (
    backfill_review_items_for_user,
    get_active_review_items,
    get_mastered_items,
    get_review_items_with_details,
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


@router.get("/items/detailed", response_model=list[ReviewItemDetailResponse])
async def get_review_items_detailed(
    user_id: str,
    status: Optional[str] = Query(None, description="フィルタ: active or mastered"),
    db: AsyncSession = Depends(get_db),
) -> list[ReviewItemDetailResponse]:
    """復習アイテムを問題内容・カテゴリ名と共に取得"""
    items = await get_review_items_with_details(db, user_id, status_filter=status)
    return [ReviewItemDetailResponse(**item) for item in items]


@router.post("/backfill", response_model=BackfillResponse)
async def backfill_review_items(
    request: BackfillRequest,
    db: AsyncSession = Depends(get_db),
) -> BackfillResponse:
    """既存の完了済み模試から復習アイテムを遡及的に作成"""
    result = await backfill_review_items_for_user(db, request.user_id)
    await db.commit()
    return BackfillResponse(**result)


@router.get("/stats", response_model=ReviewStatsResponse)
async def get_stats(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> ReviewStatsResponse:
    """復習統計を取得"""
    stats = await get_review_stats(db, user_id)
    return ReviewStatsResponse(**stats)
