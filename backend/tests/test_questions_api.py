"""問題APIエンドポイントのテスト

複数カテゴリ対応のテスト
"""
import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio(loop_scope="function")
async def test_get_random_question_multiple_categories_filters() -> None:
    """複数カテゴリで問題がフィルタリングされることを確認

    category_idsで指定した存在しないカテゴリからは問題が返らないことを確認。
    これにより実際にフィルタリングが機能していることを検証。
    """
    from httpx import ASGITransport
    from app.main import app

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
    # フィルタが機能していなければ200で問題が返る（バグ）
    # 422は不正なパラメータ
    assert response.status_code == 404, (
        "Should return 404 when category_ids filter excludes all questions. "
        f"Got {response.status_code}"
    )
