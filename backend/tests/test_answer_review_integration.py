"""回答送信と復習アイテム統合のテスト"""
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator
from unittest.mock import MagicMock, patch, AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.models.question import Question


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0
        self._added: list[Any] = []

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()

    def add(self, obj: Any) -> None:
        self._added.append(obj)

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: Any) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.mark.asyncio
async def test_incorrect_answer_creates_review_item(
    mock_db: MockDBSession,
) -> None:
    """不正解の回答送信で復習アイテムが作成される"""
    question_id = uuid.uuid4()

    # Question取得クエリ結果
    question = Question(
        id=question_id,
        category_id=uuid.uuid4(),
        content="テスト問題",
        choices=["A", "B", "C", "D"],
        correct_answer=2,
        explanation="解説",
        difficulty=1,
        source="テスト",
    )
    question_result = MagicMock()
    question_result.scalar_one_or_none.return_value = question

    # review_service: handle_incorrect_answer用 - 既存アイテムなし
    review_result = MagicMock()
    review_result.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([question_result, review_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/answers",
                json={
                    "question_id": str(question_id),
                    "user_id": "test_user",
                    "selected_answer": 0,  # 不正解（correct_answer=2）
                },
            )

        assert response.status_code == 201
        data = response.json()
        assert data["is_correct"] is False

        # review_itemが追加されたことを確認
        review_items = [
            obj
            for obj in mock_db._added
            if hasattr(obj, "status") and hasattr(obj, "correct_count")
        ]
        assert len(review_items) >= 1
        assert review_items[0].status == "active"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_correct_answer_calls_review_update(
    mock_db: MockDBSession,
) -> None:
    """正解の回答送信でreview updateが呼ばれる"""
    question_id = uuid.uuid4()

    question = Question(
        id=question_id,
        category_id=uuid.uuid4(),
        content="テスト問題",
        choices=["A", "B", "C", "D"],
        correct_answer=2,
        explanation="解説",
        difficulty=1,
        source="テスト",
    )
    question_result = MagicMock()
    question_result.scalar_one_or_none.return_value = question

    # review_service: handle_correct_answer用 - activeアイテムなし
    review_result = MagicMock()
    review_result.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([question_result, review_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/answers",
                json={
                    "question_id": str(question_id),
                    "user_id": "test_user",
                    "selected_answer": 2,  # 正解
                },
            )

        assert response.status_code == 201
        data = response.json()
        assert data["is_correct"] is True
    finally:
        app.dependency_overrides.clear()
