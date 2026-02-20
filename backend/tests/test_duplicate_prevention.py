"""重複防止機能のテスト

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
from app.services.question_service import get_question_hash


class TestContentHash:
    """コンテンツハッシュ計算のテスト"""

    def test_get_question_hash_returns_string(self) -> None:
        """ハッシュ計算が文字列を返すことを確認"""
        content = "テスト問題の内容です"
        result = get_question_hash(content)
        assert isinstance(result, str)

    def test_get_question_hash_returns_consistent_hash(self) -> None:
        """同じ内容に対して同じハッシュを返すことを確認"""
        content = "バックプロパゲーションの目的は何か？"
        hash1 = get_question_hash(content)
        hash2 = get_question_hash(content)
        assert hash1 == hash2

    def test_get_question_hash_returns_different_hash_for_different_content(self) -> None:
        """異なる内容に対して異なるハッシュを返すことを確認"""
        content1 = "問題1の内容"
        content2 = "問題2の内容"
        hash1 = get_question_hash(content1)
        hash2 = get_question_hash(content2)
        assert hash1 != hash2

    def test_get_question_hash_length_is_32(self) -> None:
        """ハッシュの長さが32文字であることを確認"""
        content = "テスト内容"
        result = get_question_hash(content)
        assert len(result) == 32


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(self, name: str = "未分類") -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = None


class MockQuestion:
    """テスト用の問題モック"""

    def __init__(self, content_hash: str | None = None) -> None:
        self.id = uuid.uuid4()
        self.category_id = uuid.uuid4()
        self.content = "テスト問題"
        self.content_hash = content_hash or get_question_hash("テスト問題")
        self.choices = ["A", "B", "C", "D"]
        self.correct_answer = 1
        self.explanation = "解説テキスト"
        self.difficulty = 3
        self.source = "テスト問題集"
        self.content_type = "plain"
        self.images = []


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
async def test_import_skips_duplicate_questions(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """同じ問題を2回インポートした場合、重複をスキップする"""
    mock_category = MockCategory()

    # 既存の問題（重複チェック用）
    existing_question = MockQuestion()
    existing_hash = get_question_hash("これは重複問題です。")
    existing_question.content_hash = existing_hash

    # カテゴリ検索結果
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    # 重複チェック: 1問目は既存、2問目は新規
    mock_duplicate_result_1 = MagicMock()
    mock_duplicate_result_1.scalar_one_or_none.return_value = existing_question  # 重複あり

    mock_duplicate_result_2 = MagicMock()
    mock_duplicate_result_2.scalar_one_or_none.return_value = None  # 重複なし

    # カテゴリマップ構築用（空）
    mock_all_categories = MagicMock()
    mock_all_categories.scalars.return_value.all.return_value = []

    mock_db.set_execute_results([
        mock_category_result,
        mock_all_categories,
        mock_duplicate_result_1,
        mock_duplicate_result_2,
    ])

    # Claude CLIの抽出結果をモック
    mock_questions = [
        {
            "content": "これは重複問題です。",  # 既存の問題と重複
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "plain",
        },
        {
            "content": "これは新規問題です。",  # 新規問題
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 1,
            "explanation": "解説2",
            "difficulty": 3,
            "content_type": "plain",
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

            # レスポンス検証
            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 2  # 抽出された問題数
            assert data["saved_count"] == 1  # 保存された問題数（重複1件がスキップされた）

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_saves_all_new_questions(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """すべて新規問題の場合、全件保存される"""
    mock_category = MockCategory()

    # カテゴリ検索結果
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    # 重複チェック: すべて新規
    mock_no_duplicate = MagicMock()
    mock_no_duplicate.scalar_one_or_none.return_value = None

    # カテゴリマップ構築用（空）
    mock_all_categories = MagicMock()
    mock_all_categories.scalars.return_value.all.return_value = []

    mock_db.set_execute_results([
        mock_category_result,
        mock_all_categories,
        mock_no_duplicate,
        mock_no_duplicate,
    ])

    mock_questions = [
        {
            "content": "新規問題1",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "plain",
        },
        {
            "content": "新規問題2",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 1,
            "explanation": "解説2",
            "difficulty": 3,
            "content_type": "plain",
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
            data = response.json()
            assert data["count"] == 2
            assert data["saved_count"] == 2  # すべて保存

    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_import_skips_all_duplicate_questions(
    mock_db: MockDBSession,
    sample_pdf_bytes: bytes,
) -> None:
    """すべて重複の場合、0件保存される"""
    mock_category = MockCategory()

    # カテゴリ検索結果
    mock_category_result = MagicMock()
    mock_category_result.scalar_one_or_none.return_value = mock_category

    # 重複チェック: すべて重複
    mock_duplicate = MagicMock()
    mock_duplicate.scalar_one_or_none.return_value = MockQuestion()

    # カテゴリマップ構築用（空）
    mock_all_categories = MagicMock()
    mock_all_categories.scalars.return_value.all.return_value = []

    mock_db.set_execute_results([
        mock_category_result,
        mock_all_categories,
        mock_duplicate,
        mock_duplicate,
    ])

    mock_questions = [
        {
            "content": "重複問題1",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "解説1",
            "difficulty": 3,
            "content_type": "plain",
        },
        {
            "content": "重複問題2",
            "choices": ["A", "B", "C", "D"],
            "correct_answer": 1,
            "explanation": "解説2",
            "difficulty": 3,
            "content_type": "plain",
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
            data = response.json()
            assert data["count"] == 2  # 抽出された問題数
            assert data["saved_count"] == 0  # すべてスキップ

    finally:
        app.dependency_overrides.clear()
