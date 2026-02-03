"""全問題削除APIの保護テスト

このテストは、DELETE /api/questions/all エンドポイントが
適切に保護されていることを確認する。

保護要件:
1. 本番環境では全削除が禁止される
2. 確認トークンが必要
"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockDBSession:
    """モックDBセッション"""

    async def execute(self, query: object) -> MagicMock:
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_result.scalars.return_value.all.return_value = []
        return mock_result

    def add(self, obj: object) -> None:
        pass

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.mark.asyncio
async def test_delete_all_disabled_in_production(mock_db: MockDBSession) -> None:
    """本番環境では全削除が403エラーになる"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.settings") as mock_settings:
            mock_settings.is_production = True

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.delete(
                    "/api/questions/all",
                    params={"confirm": "DELETE_ALL_QUESTIONS"},
                )

            assert response.status_code == 403
            data = response.json()
            assert "本番環境" in data["detail"]

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_all_requires_confirmation_token(mock_db: MockDBSession) -> None:
    """確認トークンがない場合は400エラーになる"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.settings") as mock_settings:
            mock_settings.is_production = False

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                # 確認トークンなしでリクエスト
                response = await client.delete("/api/questions/all")

            # クエリパラメータがないため422（バリデーションエラー）
            assert response.status_code == 422

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_all_rejects_wrong_confirmation_token(mock_db: MockDBSession) -> None:
    """確認トークンが間違っている場合は400エラーになる"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.settings") as mock_settings:
            mock_settings.is_production = False

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.delete(
                    "/api/questions/all",
                    params={"confirm": "wrong_token"},
                )

            assert response.status_code == 400
            data = response.json()
            assert "確認トークン" in data["detail"]

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_all_succeeds_with_correct_token_in_dev(mock_db: MockDBSession) -> None:
    """開発環境で正しい確認トークンがあれば削除成功"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.settings") as mock_settings:
            mock_settings.is_production = False

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.delete(
                    "/api/questions/all",
                    params={"confirm": "DELETE_ALL_QUESTIONS"},
                )

            assert response.status_code == 200
            data = response.json()
            assert "deleted_count" in data

    finally:
        app.dependency_overrides.clear()
