"""復習APIエンドポイントのテスト"""
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.models.review_item import ReviewItem


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.mark.asyncio
async def test_get_review_items_empty(mock_db: MockDBSession) -> None:
    """復習アイテムが空の場合、空リストを返す"""
    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = []
    mock_db.set_execute_results([result_mock])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/review/items?user_id=test_user"
            )

        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_review_items_with_data(mock_db: MockDBSession) -> None:
    """復習アイテムがある場合、データを返す"""
    item_id = uuid.uuid4()
    question_id = uuid.uuid4()
    now = datetime.now()

    item = ReviewItem(
        id=item_id,
        question_id=question_id,
        user_id="test_user",
        correct_count=3,
        status="active",
        first_wrong_at=now,
        last_answered_at=now,
    )

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [item]
    mock_db.set_execute_results([result_mock])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/review/items?user_id=test_user"
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["question_id"] == str(question_id)
        assert data[0]["correct_count"] == 3
        assert data[0]["status"] == "active"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_review_stats(mock_db: MockDBSession) -> None:
    """復習統計を返す"""
    # active_count
    active_result = MagicMock()
    active_result.scalar.return_value = 5

    # mastered_count
    mastered_result = MagicMock()
    mastered_result.scalar.return_value = 3

    mock_db.set_execute_results([active_result, mastered_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/review/stats?user_id=test_user"
            )

        assert response.status_code == 200
        data = response.json()
        assert data["active_count"] == 5
        assert data["mastered_count"] == 3
        assert data["total_count"] == 8
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mastered_items(mock_db: MockDBSession) -> None:
    """習得済みアイテムを返す"""
    now = datetime.now()
    item = ReviewItem(
        id=uuid.uuid4(),
        question_id=uuid.uuid4(),
        user_id="test_user",
        correct_count=10,
        status="mastered",
        first_wrong_at=now,
        last_answered_at=now,
        mastered_at=now,
    )

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [item]
    mock_db.set_execute_results([result_mock])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/review/mastered?user_id=test_user"
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "mastered"
        assert data[0]["correct_count"] == 10
    finally:
        app.dependency_overrides.clear()
