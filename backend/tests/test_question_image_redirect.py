"""画像取得エンドポイントのリダイレクトテスト

Supabase Storage URLが file_path に入っている場合、
302リダイレクトを返すことを検証する。
"""
import uuid
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


def make_mock_image(file_path: str) -> MagicMock:
    """QuestionImageのモックを生成"""
    image = MagicMock()
    image.file_path = file_path
    image.id = uuid.uuid4()
    image.question_id = uuid.uuid4()
    return image


class MockDBSessionWithImage:
    """画像レコードを返すモックDBセッション"""

    def __init__(self, image: MagicMock) -> None:
        self._image = image

    async def execute(self, query: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = self._image
        return result


class MockDBSessionNoImage:
    """画像レコードなしを返すモックDBセッション"""

    async def execute(self, query: object) -> MagicMock:
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        return result


@pytest.mark.asyncio
async def test_get_question_image_redirects_for_supabase_url() -> None:
    """file_pathがHTTP URLの場合、302リダイレクトを返す"""
    supabase_url = "https://xxxxx.supabase.co/storage/v1/object/public/images/test.png"
    image = make_mock_image(supabase_url)
    question_id = image.question_id
    image_id = image.id

    mock_db = MockDBSessionWithImage(image)

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            follow_redirects=False,
        ) as client:
            response = await client.get(
                f"/api/questions/{question_id}/images/{image_id}",
            )

        assert response.status_code == 307, (
            f"Expected 307 redirect for Supabase URL, got {response.status_code}"
        )
        assert response.headers["location"] == supabase_url
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_get_question_image_redirects_for_https_url() -> None:
    """file_pathが任意のHTTPS URLの場合も、リダイレクトを返す"""
    url = "https://example.com/images/diagram.png"
    image = make_mock_image(url)
    question_id = image.question_id
    image_id = image.id

    mock_db = MockDBSessionWithImage(image)

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            follow_redirects=False,
        ) as client:
            response = await client.get(
                f"/api/questions/{question_id}/images/{image_id}",
            )

        assert response.status_code == 307, (
            f"Expected 307 redirect for HTTPS URL, got {response.status_code}"
        )
        assert response.headers["location"] == url
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_get_question_image_404_when_not_found() -> None:
    """画像レコードが見つからない場合は404を返す"""
    mock_db = MockDBSessionNoImage()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(
                f"/api/questions/{uuid.uuid4()}/images/{uuid.uuid4()}",
            )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
