"""スマート出題サービスのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockQuestionImage:
    """テスト用の問題画像モック"""

    def __init__(self, question_id: uuid.UUID | None = None) -> None:
        self.id = uuid.uuid4()
        self.question_id = question_id or uuid.uuid4()
        self.file_path = "/static/images/test.png"
        self.alt_text = "テスト画像"
        self.position = 0
        self.image_type = "diagram"


class MockQuestion:
    """テスト用の問題モック"""

    def __init__(self, category_id: uuid.UUID | None = None) -> None:
        self.id = uuid.uuid4()
        self.category_id = category_id or uuid.uuid4()
        self.content = "テスト問題"
        self.choices = ["A", "B", "C", "D"]
        self.correct_answer = 1
        self.explanation = "解説テキスト"
        self.difficulty = 3
        self.source = "テスト問題集"
        self.content_type = "plain"
        self.images: list[MockQuestionImage] = []


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0
        self._mock_question: MockQuestion | None = None

    def set_mock_question(self, question: MockQuestion) -> None:
        self._mock_question = question

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        # デフォルトでモック問題を返す
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = self._mock_question
        mock_result.scalars.return_value.all.return_value = []
        mock_result.all.return_value = []
        return mock_result


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.mark.asyncio
async def test_get_smart_question_prioritizes_weak_areas(mock_db: MockDBSession) -> None:
    """苦手分野から優先的に出題される"""
    weak_category_id = uuid.uuid4()
    mock_question = MockQuestion(category_id=weak_category_id)
    mock_db.set_mock_question(mock_question)

    # 苦手カテゴリの取得結果
    weak_areas_result = MagicMock()
    weak_areas_result.all.return_value = [(weak_category_id, "苦手カテゴリ", 10, 3, 30.0)]

    # 最近回答した問題ID（空）
    recent_result = MagicMock()
    recent_result.scalars.return_value.all.return_value = []

    # 問題取得結果
    question_result = MagicMock()
    question_result.scalar_one_or_none.return_value = mock_question

    mock_db.set_execute_results([weak_areas_result, recent_result, question_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/smart?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert data["category_id"] == str(weak_category_id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_smart_question_falls_back_to_random(mock_db: MockDBSession) -> None:
    """苦手分野がない場合はランダム出題"""
    mock_question = MockQuestion()
    mock_db.set_mock_question(mock_question)

    # 苦手カテゴリなし
    weak_areas_result = MagicMock()
    weak_areas_result.all.return_value = []

    # 最近回答した問題ID（空）
    recent_result = MagicMock()
    recent_result.scalars.return_value.all.return_value = []

    # ランダム問題取得結果
    random_result = MagicMock()
    random_result.scalar_one_or_none.return_value = mock_question

    mock_db.set_execute_results([weak_areas_result, recent_result, random_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/smart?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(mock_question.id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_smart_question_no_questions_found(mock_db: MockDBSession) -> None:
    """問題がない場合は404"""
    # 苦手カテゴリなし
    weak_areas_result = MagicMock()
    weak_areas_result.all.return_value = []

    # 最近回答した問題ID（空）
    recent_result = MagicMock()
    recent_result.scalars.return_value.all.return_value = []

    # 問題なし
    no_question_result = MagicMock()
    no_question_result.scalar_one_or_none.return_value = None

    mock_db.set_execute_results([weak_areas_result, recent_result, no_question_result, no_question_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/smart?user_id=test_user")

        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_smart_question_with_images(mock_db: MockDBSession) -> None:
    """画像を持つ問題のimagesリレーションがロードされる"""
    mock_question = MockQuestion()
    # 画像を追加
    mock_image = MockQuestionImage(question_id=mock_question.id)
    mock_question.images = [mock_image]
    mock_db.set_mock_question(mock_question)

    # 苦手カテゴリなし
    weak_areas_result = MagicMock()
    weak_areas_result.all.return_value = []

    # 最近回答した問題ID（空）
    recent_result = MagicMock()
    recent_result.scalars.return_value.all.return_value = []

    # ランダム問題取得結果
    random_result = MagicMock()
    random_result.scalar_one_or_none.return_value = mock_question

    mock_db.set_execute_results([weak_areas_result, recent_result, random_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/smart?user_id=test_user")

        assert response.status_code == 200
        data = response.json()
        assert "images" in data
        assert len(data["images"]) == 1
        assert data["images"][0]["alt_text"] == "テスト画像"
        assert data["images"][0]["image_type"] == "diagram"
    finally:
        app.dependency_overrides.clear()
