"""問題関連のサービス層"""
import hashlib
import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.question import Question
from app.schemas.question import QuestionCreate


def get_question_hash(content: str) -> str:
    """問題文のハッシュを計算

    重複チェックに使用する32文字のハッシュ値を返す。

    Args:
        content: 問題文

    Returns:
        32文字のハッシュ値
    """
    return hashlib.sha256(content.encode()).hexdigest()[:32]


def resolve_category_id(
    category_name: str | None,
    category_map: dict[str, uuid.UUID],
) -> uuid.UUID | None:
    """カテゴリ名からIDを解決する

    Args:
        category_name: PDF抽出で得られたカテゴリ名
        category_map: カテゴリ名→IDのマッピング

    Returns:
        カテゴリID。解決できない場合はNone
    """
    if not category_name:
        return None
    return category_map.get(category_name)


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
    category_ids: Optional[list[uuid.UUID]] = None,
) -> Optional[Question]:
    """ランダムな問題を取得するサービス

    Args:
        db: データベースセッション
        category_id: 単一のカテゴリID（後方互換性）
        category_ids: 複数のカテゴリIDリスト

    Returns:
        ランダムに選択された問題、または見つからない場合はNone
    """
    query = select(Question).options(selectinload(Question.images))

    # 複数カテゴリが指定された場合はそちらを優先
    if category_ids:
        query = query.where(Question.category_id.in_(category_ids))
    elif category_id:
        query = query.where(Question.category_id == category_id)

    # TensorFlow専用問題を除外
    query = query.where(
        (Question.framework.is_(None)) | (Question.framework != "tensorflow")
    )

    query = query.order_by(func.random()).limit(1)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_question_service(
    db: AsyncSession,
    question_data: QuestionCreate,
) -> Question:
    """問題を作成するサービス"""
    # category_idがNoneの場合はデフォルトカテゴリを使用
    category_id = question_data.category_id
    if category_id is None:
        category_id = await get_or_create_default_category(db)

    question = Question(
        id=uuid.uuid4(),
        category_id=category_id,
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

    # imagesリレーションを含めて再取得
    result = await db.execute(
        select(Question)
        .options(selectinload(Question.images))
        .where(Question.id == question.id)
    )
    return result.scalar_one()
