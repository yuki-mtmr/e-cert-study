"""カテゴリAPIエンドポイント"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


async def get_categories_service(db: AsyncSession) -> list[Category]:
    """カテゴリ一覧を取得するサービス"""
    result = await db.execute(select(Category))
    return list(result.scalars().all())


async def get_category_by_id_service(
    db: AsyncSession,
    category_id: uuid.UUID,
) -> Optional[Category]:
    """IDでカテゴリを取得するサービス"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()


async def create_category_service(
    db: AsyncSession,
    category_data: CategoryCreate,
) -> Category:
    """カテゴリを作成するサービス"""
    category = Category(
        id=uuid.uuid4(),
        name=category_data.name,
        parent_id=category_data.parent_id,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.get("", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)) -> list[Category]:
    """カテゴリ一覧を取得"""
    return await get_categories_service(db)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Category:
    """カテゴリ詳細を取得"""
    category = await get_category_by_id_service(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
) -> Category:
    """カテゴリを作成"""
    return await create_category_service(db, category_data)
