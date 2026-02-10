"""FastAPIアプリケーションのテスト"""
import pytest
from unittest.mock import MagicMock
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


@pytest.mark.asyncio
async def test_health_check() -> None:
    """ヘルスチェックエンドポイントのテスト"""

    class MockDB:
        async def execute(self, query):
            return MagicMock()

    async def override_get_db():
        yield MockDB()

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "healthy", "database": "connected"}
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_cors_headers() -> None:
    """CORSヘッダーが設定されていることを確認"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        response = await client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
