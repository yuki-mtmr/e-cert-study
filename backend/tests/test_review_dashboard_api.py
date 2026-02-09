"""復習アイテム詳細取得API（ダッシュボード用）のテスト"""
import uuid
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.question import Question
from app.models.review_item import ReviewItem


def _make_review_item_with_question(
    status: str = "active",
    correct_count: int = 3,
    category_name: str = "機械学習",
) -> ReviewItem:
    """問題データ付きの復習アイテムを作成"""
    category = Category(
        id=uuid.uuid4(),
        name=category_name,
    )
    question = Question(
        id=uuid.uuid4(),
        category_id=category.id,
        content="これはテスト問題です。" * 10,  # 長い問題文
        choices=["A", "B", "C", "D"],
        correct_answer=2,
        explanation="解説文",
        difficulty=3,
        source="テスト",
    )
    question.category = category

    item = ReviewItem(
        id=uuid.uuid4(),
        question_id=question.id,
        user_id="test_user",
        correct_count=correct_count,
        status=status,
        first_wrong_at=datetime.utcnow(),
        last_answered_at=datetime.utcnow(),
        mastered_at=datetime.utcnow() if status == "mastered" else None,
    )
    item.question = question

    return item


class MockScalarsAll:
    """db.execute().scalars().all() をモック"""

    def __init__(self, items: list[Any]) -> None:
        self._items = items

    def scalars(self) -> "MockScalarsAll":
        return self

    def all(self) -> list[Any]:
        return self._items


@pytest.mark.asyncio
async def test_get_review_items_with_details_returns_question_content() -> None:
    """問題内容（先頭100文字）が含まれる"""
    item = _make_review_item_with_question()

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([item]))

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(mock_db, "test_user")

    assert len(result) == 1
    assert "question_content" in result[0]
    # 100文字以下に切り詰められている
    assert len(result[0]["question_content"]) <= 100


@pytest.mark.asyncio
async def test_get_review_items_with_details_returns_category_name() -> None:
    """カテゴリ名が含まれる"""
    item = _make_review_item_with_question(category_name="深層学習の基礎")

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([item]))

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(mock_db, "test_user")

    assert result[0]["question_category_name"] == "深層学習の基礎"


@pytest.mark.asyncio
async def test_get_review_items_with_details_filter_active() -> None:
    """statusフィルタでactiveのみ取得可能"""
    active = _make_review_item_with_question(status="active")
    mastered = _make_review_item_with_question(status="mastered", correct_count=10)

    mock_db = MagicMock()
    # フィルタされた結果（activeのみ）を返す
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([active]))

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(
        mock_db, "test_user", status_filter="active"
    )

    assert len(result) == 1
    assert result[0]["status"] == "active"


@pytest.mark.asyncio
async def test_get_review_items_with_details_filter_mastered() -> None:
    """statusフィルタでmasteredのみ取得可能"""
    mastered = _make_review_item_with_question(status="mastered", correct_count=10)

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([mastered]))

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(
        mock_db, "test_user", status_filter="mastered"
    )

    assert len(result) == 1
    assert result[0]["status"] == "mastered"


@pytest.mark.asyncio
async def test_get_review_items_with_details_includes_all_fields() -> None:
    """全フィールドが正しく含まれる"""
    item = _make_review_item_with_question()

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([item]))

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(mock_db, "test_user")

    detail = result[0]
    assert "id" in detail
    assert "question_id" in detail
    assert "user_id" in detail
    assert "correct_count" in detail
    assert "status" in detail
    assert "first_wrong_at" in detail
    assert "last_answered_at" in detail
    assert "question_content" in detail
    assert "question_category_name" in detail


@pytest.mark.asyncio
async def test_get_review_items_with_details_eager_loads_category() -> None:
    """Question.category がeager loadされる（async環境での遅延ロード防止）"""
    item = _make_review_item_with_question(category_name="応用数学")

    captured_query = {}

    original_execute = AsyncMock(return_value=MockScalarsAll([item]))

    async def capture_execute(query):
        captured_query["query"] = query
        return original_execute.return_value

    mock_db = MagicMock()
    mock_db.execute = capture_execute

    from app.services.review_service import get_review_items_with_details

    result = await get_review_items_with_details(mock_db, "test_user")

    # クエリにQuestion.categoryのeager loadオプションが含まれている
    query = captured_query["query"]
    load_options = query._with_options
    # selectinload(ReviewItem.question).selectinload(Question.category) が設定されている
    # Load オブジェクトの path にcategoryが含まれるか確認
    has_category_load = False
    for opt in load_options:
        path_str = str(getattr(opt, "path", ""))
        if "category" in path_str.lower():
            has_category_load = True
            break
    assert has_category_load, (
        "Question.category のeager loadが設定されていない。"
        "async SQLAlchemy では遅延ロードが不可のため、"
        "selectinload(ReviewItem.question).selectinload(Question.category) が必要。"
    )
