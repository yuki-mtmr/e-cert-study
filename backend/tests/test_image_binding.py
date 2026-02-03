"""画像と問題の紐付けテスト

Phase 3: 画像と問題の正確な紐付け
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
        mock = MagicMock()
        mock.scalar_one_or_none.return_value = None
        return mock

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
    return bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00,
        0x1F, 0x15, 0xC4, 0x89,
        0x00, 0x00, 0x00, 0x0A,
        0x49, 0x44, 0x41, 0x54,
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
        0x0D, 0x0A, 0x2D, 0xB4,
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82,
    ])


@pytest.mark.asyncio
async def test_image_binding_with_image_refs(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
    sample_png_bytes: bytes,
) -> None:
    """image_refsに基づいて画像が正しく紐付けられる"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    # MinerU抽出結果: 3つの画像
    mock_mineru_result = MinerUExtractionResult(
        markdown="# テスト\n\n![図1](image_001.png)\n\n![図2](image_002.png)\n\n![図3](image_003.png)",
        images=[
            ExtractedImage(
                filename="image_001.png",
                data=sample_png_bytes,
                page_number=1,
                position=0,
            ),
            ExtractedImage(
                filename="image_002.png",
                data=sample_png_bytes,
                page_number=1,
                position=1,
            ),
            ExtractedImage(
                filename="image_003.png",
                data=sample_png_bytes,
                page_number=2,
                position=2,
            ),
        ],
        metadata={"page_count": 2},
    )

    mock_vlm_result = VLMAnalysisResult(
        description="Diagram",
        model="llava:7b",
        image_type="diagram",
    )

    # Claude抽出結果: 2問、各問題に異なる画像を紐付け
    mock_questions = [
        {
            "content": "問題1",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "markdown",
            "image_refs": ["image_001.png"],  # 画像1のみ
        },
        {
            "content": "問題2",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 1,
            "explanation": "解説2",
            "difficulty": 3,
            "content_type": "markdown",
            "image_refs": ["image_002.png", "image_003.png"],  # 画像2と3
        },
    ]

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

            mock_vlm = MagicMock()
            mock_vlm.analyze = AsyncMock(return_value=mock_vlm_result)
            mock_vlm_class.return_value = mock_vlm

            saved_images_by_question: dict[str, list[str]] = {}

            def mock_save(**kwargs):
                question_id = str(kwargs.get("question_id"))
                if question_id not in saved_images_by_question:
                    saved_images_by_question[question_id] = []
                saved_images_by_question[question_id].append("image")
                return MagicMock(
                    id=uuid.uuid4(),
                    file_path="/static/images/test.png",
                )

            mock_storage = MagicMock()
            mock_storage.save.side_effect = mock_save
            mock_storage_class.return_value = mock_storage

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

            assert response.status_code == 200
            data = response.json()
            assert data["saved_count"] == 2

            # 画像保存回数を確認: 問題1に1枚、問題2に2枚 = 合計3回
            assert mock_storage.save.call_count == 3

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_image_binding_no_refs(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
    sample_png_bytes: bytes,
) -> None:
    """image_refsが空の場合、画像は紐付けられない"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    mock_mineru_result = MinerUExtractionResult(
        markdown="# テスト\n\n![図1](image_001.png)",
        images=[
            ExtractedImage(
                filename="image_001.png",
                data=sample_png_bytes,
                page_number=1,
                position=0,
            ),
        ],
        metadata={"page_count": 1},
    )

    # 問題にimage_refsがない
    mock_questions = [
        {
            "content": "問題1",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "plain",
            "image_refs": [],  # 空
        },
    ]

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

            mock_vlm = MagicMock()
            mock_vlm_class.return_value = mock_vlm

            mock_storage = MagicMock()
            mock_storage_class.return_value = mock_storage

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

            assert response.status_code == 200

            # 画像保存は呼ばれない（image_refsが空なので）
            mock_storage.save.assert_not_called()

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_image_binding_missing_image(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
    sample_png_bytes: bytes,
) -> None:
    """存在しない画像ファイル名がimage_refsにある場合、スキップされる"""
    mock_category = MockCategory()
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category
    mock_db.set_execute_results([mock_category_result])

    mock_mineru_result = MinerUExtractionResult(
        markdown="# テスト",
        images=[
            ExtractedImage(
                filename="image_001.png",
                data=sample_png_bytes,
                page_number=1,
                position=0,
            ),
        ],
        metadata={"page_count": 1},
    )

    mock_vlm_result = VLMAnalysisResult(
        description="Diagram",
        model="llava:7b",
        image_type="diagram",
    )

    # 存在しない画像を参照
    mock_questions = [
        {
            "content": "問題1",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "markdown",
            "image_refs": ["image_001.png", "image_999.png"],  # image_999は存在しない
        },
    ]

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

            mock_vlm = MagicMock()
            mock_vlm.analyze = AsyncMock(return_value=mock_vlm_result)
            mock_vlm_class.return_value = mock_vlm

            mock_storage = MagicMock()
            mock_storage.save.return_value = MagicMock(
                id=uuid.uuid4(),
                file_path="/static/images/test.png",
            )
            mock_storage_class.return_value = mock_storage

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

            assert response.status_code == 200

            # 存在する画像のみ保存される（1回のみ）
            assert mock_storage.save.call_count == 1

    finally:
        app.dependency_overrides.clear()
