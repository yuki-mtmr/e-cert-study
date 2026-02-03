"""content_type設定のテスト

Claudeが判定したcontent_typeが正しく設定されることを確認

TDD: RED -> GREEN -> REFACTOR
"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from io import BytesIO

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


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


@pytest.mark.asyncio
async def test_import_uses_claude_content_type_plain(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """Claudeが判定したcontent_type=plainが正しく設定される"""
    mock_category = MockCategory()

    # カテゴリ検索結果
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    # 重複チェック: 新規
    mock_no_duplicate = MagicMock()
    mock_no_duplicate.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([
        mock_category_result,
        mock_no_duplicate,
    ])

    mock_questions = [
        {
            "content": "テスト問題",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説",
            "difficulty": 3,
            "content_type": "plain",  # Claudeが判定
        },
    ]

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extract_text.return_value = "テスト問題のテキスト"
            mock_extract.return_value = mock_questions

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true", "use_mineru": "false"},
                )

            assert response.status_code == 200

            # 保存されたオブジェクトを確認
            assert len(mock_db.added_objects) == 1
            saved_question = mock_db.added_objects[0]
            assert saved_question.content_type == "plain"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_uses_claude_content_type_markdown(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """Claudeが判定したcontent_type=markdownが正しく設定される"""
    mock_category = MockCategory()

    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    mock_no_duplicate = MagicMock()
    mock_no_duplicate.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([
        mock_category_result,
        mock_no_duplicate,
    ])

    mock_questions = [
        {
            "content": "# 問題\n\n数式: $E = mc^2$",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説",
            "difficulty": 3,
            "content_type": "markdown",  # Claudeが判定
        },
    ]

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extract_text.return_value = "テスト問題のテキスト"
            mock_extract.return_value = mock_questions

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true", "use_mineru": "false"},
                )

            assert response.status_code == 200

            assert len(mock_db.added_objects) == 1
            saved_question = mock_db.added_objects[0]
            assert saved_question.content_type == "markdown"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_uses_claude_content_type_code(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """Claudeが判定したcontent_type=codeが正しく設定される"""
    mock_category = MockCategory()

    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    mock_no_duplicate = MagicMock()
    mock_no_duplicate.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([
        mock_category_result,
        mock_no_duplicate,
    ])

    mock_questions = [
        {
            "content": "```python\ndef hello():\n    print('Hello')\n```",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説",
            "difficulty": 3,
            "content_type": "code",  # Claudeが判定
        },
    ]

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extract_text.return_value = "テスト問題のテキスト"
            mock_extract.return_value = mock_questions

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true", "use_mineru": "false"},
                )

            assert response.status_code == 200

            assert len(mock_db.added_objects) == 1
            saved_question = mock_db.added_objects[0]
            assert saved_question.content_type == "code"

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_defaults_to_plain_when_no_content_type(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """content_typeが指定されていない場合、デフォルトでplainになる"""
    mock_category = MockCategory()

    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    mock_no_duplicate = MagicMock()
    mock_no_duplicate.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([
        mock_category_result,
        mock_no_duplicate,
    ])

    mock_questions = [
        {
            "content": "テスト問題",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説",
            "difficulty": 3,
            # content_type未指定
        },
    ]

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.api.questions.extract_text_from_pdf") as mock_extract_text, \
             patch("app.api.questions.extract_questions_from_text") as mock_extract:

            mock_extract_text.return_value = "テスト問題のテキスト"
            mock_extract.return_value = mock_questions

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/import",
                    files={"file": ("test.pdf", BytesIO(sample_pdf_bytes), "application/pdf")},
                    data={"save_to_db": "true", "use_mineru": "false"},
                )

            assert response.status_code == 200

            assert len(mock_db.added_objects) == 1
            saved_question = mock_db.added_objects[0]
            assert saved_question.content_type == "plain"

    finally:
        app.dependency_overrides.clear()
