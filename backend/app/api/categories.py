"""カテゴリAPIエンドポイント"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.category import Category
from app.models.question import Question
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategorySeedResponse,
    CategoryTreeResponse,
)

router = APIRouter(prefix="/api/categories", tags=["categories"])

# E資格カテゴリ構成
E_CERT_CATEGORIES: dict[str, list[str]] = {
    "応用数学": ["線形代数", "確率・統計", "情報理論"],
    "機械学習": ["教師あり学習", "教師なし学習", "評価指標"],
    "深層学習": [
        "順伝播型ニューラルネットワーク",
        "CNN",
        "RNN",
        "Transformer",
        "生成モデル",
        "強化学習",
    ],
}


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


@router.get("/tree", response_model=list[CategoryTreeResponse])
async def get_categories_tree(
    db: AsyncSession = Depends(get_db),
) -> list[CategoryTreeResponse]:
    """カテゴリをツリー構造で取得"""
    # 全カテゴリを子リレーションと共に取得
    result = await db.execute(
        select(Category).options(selectinload(Category.children))
    )
    all_categories = list(result.scalars().all())

    # カテゴリ別の問題数を取得
    count_result = await db.execute(
        select(Question.category_id, func.count(Question.id))
        .group_by(Question.category_id)
    )
    question_counts: dict[uuid.UUID, int] = {
        row[0]: row[1] for row in count_result.all()
    }

    # ルートカテゴリ（parent_idがNone）のみを抽出
    root_categories = [c for c in all_categories if c.parent_id is None]

    def build_tree(category: Category) -> CategoryTreeResponse:
        """再帰的にツリー構造を構築"""
        return CategoryTreeResponse(
            id=category.id,
            name=category.name,
            parent_id=category.parent_id,
            children=[build_tree(child) for child in category.children],
            question_count=question_counts.get(category.id, 0),
        )

    return [build_tree(root) for root in root_categories]


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


@router.post("/seed", response_model=CategorySeedResponse)
async def seed_categories(
    db: AsyncSession = Depends(get_db),
) -> CategorySeedResponse:
    """E資格カテゴリ初期データを作成"""
    # 既存カテゴリを確認
    existing = await get_categories_service(db)
    if existing:
        return CategorySeedResponse(
            message="カテゴリは既に存在します",
            created_count=0,
        )

    created_count = 0

    # 親カテゴリを作成
    for parent_name, children_names in E_CERT_CATEGORIES.items():
        parent = Category(
            id=uuid.uuid4(),
            name=parent_name,
            parent_id=None,
        )
        db.add(parent)
        await db.flush()
        created_count += 1

        # 子カテゴリを作成
        for child_name in children_names:
            child = Category(
                id=uuid.uuid4(),
                name=child_name,
                parent_id=parent.id,
            )
            db.add(child)
            created_count += 1

    await db.commit()

    return CategorySeedResponse(
        message=f"{created_count}個のカテゴリを作成しました",
        created_count=created_count,
    )
