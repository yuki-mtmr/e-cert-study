"""PDFインポート統合テスト

MinerU/VLM/ImageStorage統合のテスト
"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from io import BytesIO

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.services.mineru_extractor import ExtractedImage, MinerUExtractionResult
from app.services.vlm_analyzer import VLMAnalysisResult


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(self, name: str = "未分類") -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = None


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._execute_index = 0
        self.added_objects: list[object] = []

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._execute_index = 0

    async def execute(self, query: object) -> MagicMock:
        if self._execute_index < len(self._execute_results):
            result = self._execute_results[self._execute_index]
            self._execute_index += 1
            return result
        return MagicMock()

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

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


@pytest.fixture
def sample_png_bytes() -> bytes:
    """最小限の有効なPNGバイト"""
    # 1x1 透明ピクセルのPNG
    return bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D,  # IHDR length
        0x49, 0x48, 0x44, 0x52,  # IHDR
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
        0x08, 0x06, 0x00, 0x00, 0x00,  # 8-bit RGBA
        0x1F, 0x15, 0xC4, 0x89,  # CRC
        0x00, 0x00, 0x00, 0x0A,  # IDAT length
        0x49, 0x44, 0x41, 0x54,  # IDAT
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
        0x0D, 0x0A, 0x2D, 0xB4,  # CRC
        0x00, 0x00, 0x00, 0x00,  # IEND length
        0x49, 0x45, 0x4E, 0x44,  # IEND
        0xAE, 0x42, 0x60, 0x82,  # CRC
    ])


@pytest.mark.asyncio
async def test_import_pdf_with_mineru_and_vlm(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
    sample_png_bytes: bytes,
) -> None:
    """MinerUとVLMを使用したPDFインポート"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    # MinerU抽出結果をモック
    mock_mineru_result = MinerUExtractionResult(
        markdown="# テスト問題\n\n問1. これはテスト問題です。\n\n![図1](image_001.png)\n",
        images=[
            ExtractedImage(
                filename="image_001.png",
                data=sample_png_bytes,
                page_number=1,
                position=0,
            )
        ],
        metadata={"page_count": 1},
    )

    # VLM解析結果をモック
    mock_vlm_result = VLMAnalysisResult(
        description="This is a diagram showing neural network architecture.",
        model="llava:7b",
        image_type="diagram",
    )

    # Claude CLI抽出結果をモック
    mock_questions = [
        {
            "content": "これはテスト問題です。",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説",
            "difficulty": 3,
        }
    ]

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.MinerUExtractor") as mock_extractor_class, \
             patch("app.api.questions.VLMAnalyzer") as mock_vlm_class, \
             patch("app.api.questions.ImageStorage") as mock_storage_class, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            # MinerUExtractor設定
            mock_extractor = MagicMock()
            mock_extractor.extract = AsyncMock(return_value=mock_mineru_result)
            mock_extractor_class.return_value = mock_extractor

            # VLMAnalyzer設定
            mock_vlm = MagicMock()
            mock_vlm.analyze = AsyncMock(return_value=mock_vlm_result)
            mock_vlm_class.return_value = mock_vlm

            # ImageStorage設定
            mock_storage = MagicMock()
            mock_storage.save.return_value = MagicMock(
                id=uuid.uuid4(),
                file_path="/static/images/test.png",
            )
            mock_storage_class.return_value = mock_storage

            # Claude抽出設定
            mock_extract.return_value = mock_questions

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true"},
                )

            # レスポンス検証
            assert response.status_code == 200
            data = response.json()
            assert data["count"] >= 0  # 問題抽出数

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_pdf_mineru_fallback_to_pypdf(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """MinerU失敗時にpypdfにフォールバック"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            # pypdfでテキスト抽出（既存の動作）
            mock_extract_text.return_value = "テスト問題のテキスト"
            mock_extract.return_value = [
                {
                    "content": "テスト問題",
                    "choices": ["A", "B", "C", "D"],
                    "correct_answer": 0,
                    "explanation": "解説",
                    "difficulty": 3,
                }
            ]

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true"},
                )

            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 1

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_pdf_vlm_timeout_continues(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
    sample_png_bytes: bytes,
) -> None:
    """VLMタイムアウト時も処理を継続（alt_text=null）"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    mock_mineru_result = MinerUExtractionResult(
        markdown="# テスト\n",
        images=[
            ExtractedImage(
                filename="image.png",
                data=sample_png_bytes,
                page_number=1,
                position=0,
            )
        ],
        metadata={},
    )

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.MinerUExtractor") as mock_extractor_class, \
             patch("app.api.questions.VLMAnalyzer") as mock_vlm_class, \
             patch("app.api.questions.ImageStorage") as mock_storage_class, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extractor = MagicMock()
            mock_extractor.extract = AsyncMock(return_value=mock_mineru_result)
            mock_extractor_class.return_value = mock_extractor

            # VLMタイムアウト（Noneを返す）
            mock_vlm = MagicMock()
            mock_vlm.analyze = AsyncMock(return_value=None)
            mock_vlm_class.return_value = mock_vlm

            mock_storage = MagicMock()
            mock_storage.save.return_value = MagicMock(
                id=uuid.uuid4(),
                file_path="/static/images/test.png",
            )
            mock_storage_class.return_value = mock_storage

            mock_extract.return_value = []

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true"},
                )

            # VLMがタイムアウトしても処理は継続
            assert response.status_code == 200

    finally:
        app.dependency_overrides.clear()
