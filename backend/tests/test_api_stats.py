"""統計APIエンドポイントのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


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
async def test_get_overview_stats(mock_db: MockDBSession) -> None:
    """学習概要統計を取得"""
    # 総回答数、正解数、カテゴリ別集計のモック
    total_result = MagicMock()
    total_result.scalar.return_value = 100

    correct_result = MagicMock()
    correct_result.scalar.return_value = 75

    category_result = MagicMock()
    category_result.all.return_value = [
        ("深層学習", 50, 40),
        ("機械学習", 30, 20),
        ("数学", 20, 15),
    ]

    mock_db.set_execute_results([total_result, correct_result, category_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/stats/overview?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert data["totalAnswered"] == 100
        assert data["correctCount"] == 75
        assert data["accuracy"] == 75.0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_weak_areas(mock_db: MockDBSession) -> None:
    """苦手分野を取得"""
    # 正解率が低いカテゴリを返す
    result = MagicMock()
    result.all.return_value = [
        (uuid.uuid4(), "強化学習", 20, 5, 25.0),
        (uuid.uuid4(), "自然言語処理", 30, 12, 40.0),
        (uuid.uuid4(), "画像認識", 25, 12, 48.0),
    ]

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/stats/weak-areas?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["categoryName"] == "強化学習"
        assert data[0]["accuracy"] == 25.0
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_progress(mock_db: MockDBSession) -> None:
    """日別進捗を取得"""
    result = MagicMock()
    result.all.return_value = [
        ("2024-01-01", 10, 8),
        ("2024-01-02", 15, 12),
        ("2024-01-03", 20, 18),
    ]

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/stats/progress?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["date"] == "2024-01-01"
        assert data[0]["answered"] == 10
        assert data[0]["correct"] == 8
    finally:
        app.dependency_overrides.clear()
