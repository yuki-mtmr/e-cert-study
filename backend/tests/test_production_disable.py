"""本番環境でのインポート無効化テスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock, patch
from io import BytesIO

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockDBSession:
    """モックDBセッション"""

    async def execute(self, query: object) -> MagicMock:
        return MagicMock()

    def add(self, obj: object) -> None:
        pass

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    """最小限の有効なPDFバイト"""
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"


@pytest.mark.asyncio
async def test_import_disabled_in_production(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """本番環境ではインポートが403エラーになる"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        # 本番環境をシミュレート
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.is_production = True

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true"},
                )

            assert response.status_code == 503
            detail = response.json()["detail"]
            assert detail["error_code"] == "IMPORT_DISABLED_IN_PRODUCTION"
            assert "本番環境では利用できません" in detail["message"]

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_enabled_in_development(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """開発環境ではインポートが有効"""

    class MockCategory:
        def __init__(self) -> None:
            self.id = uuid.uuid4()
            self.name = "未分類"
            self.parent_id = None

    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        mock_db_with_results = MockDBSession()
        mock_db_with_results._results = [mock_category_result]
        mock_db_with_results._index = 0

        async def mock_execute(query: object) -> MagicMock:
            if mock_db_with_results._index < len(mock_db_with_results._results):
                result = mock_db_with_results._results[mock_db_with_results._index]
                mock_db_with_results._index += 1
                return result
            return MagicMock()

        mock_db_with_results.execute = mock_execute
        yield mock_db_with_results

    app.dependency_overrides[get_db] = override_get_db

    try:
        # デフォルトでis_production=Falseなのでパッチ不要
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extract_text.return_value = "テスト"
            mock_extract.return_value = []

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true", "use_mineru": "false"},
                )

            # 開発環境では200が返る（処理が進む）
            assert response.status_code == 200

    finally:
        app.dependency_overrides.clear()
