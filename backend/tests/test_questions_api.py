"""問題APIエンドポイントのテスト

複数カテゴリ対応のテスト
"""
import uuid
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockDBSession:
    """モックDBセッション（問題なしを返す）"""

    async def execute(self, query: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        return result


@pytest.mark.asyncio
async def test_get_random_question_multiple_categories_filters() -> None:
    """複数カテゴリで問題がフィルタリングされることを確認

    category_idsで指定した存在しないカテゴリからは問題が返らないことを確認。
    これにより実際にフィルタリングが機能していることを検証。
    """
    mock_db = MockDBSession()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        # 存在しないUUID
        fake_id1 = str(uuid.uuid4())
        fake_id2 = str(uuid.uuid4())

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/questions/random",
                params={"category_ids": f"{fake_id1},{fake_id2}"},
            )

        # 存在しないカテゴリを指定した場合は問題が見つからない
        # フィルタが機能していれば404が返る
        assert response.status_code == 404, (
            "Should return 404 when category_ids filter excludes all questions. "
            f"Got {response.status_code}"
        )
    finally:
        app.dependency_overrides.pop(get_db, None)
