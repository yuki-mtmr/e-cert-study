"""ヘルスチェックエンドポイントのテスト"""
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockDBSession:
    """モックDBセッション"""

    def __init__(self, should_fail: bool = False) -> None:
        self._should_fail = should_fail

    async def execute(self, query: object) -> MagicMock:
        if self._should_fail:
            raise Exception("DB connection failed")
        return MagicMock()


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession(should_fail=False)


@pytest.fixture
def mock_db_fail() -> MockDBSession:
    return MockDBSession(should_fail=True)


@pytest.mark.asyncio
async def test_health_check_db_connected(mock_db: MockDBSession) -> None:
    """DB接続正常時に200とhealthy/connectedを返すこと"""

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_health_check_db_disconnected(mock_db_fail: MockDBSession) -> None:
    """DB接続異常時に503とunhealthy/disconnectedを返すこと"""

    async def override_get_db():
        yield mock_db_fail

    app.dependency_overrides[get_db] = override_get_db
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
    finally:
        app.dependency_overrides.pop(get_db, None)
