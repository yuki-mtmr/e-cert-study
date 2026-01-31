"""問題APIエンドポイントのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockQuestion:
    """テスト用の問題モック"""

    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.category_id = uuid.uuid4()
        self.content = "テスト問題"
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
        self._execute_result: MagicMock | None = None

    def set_execute_result(self, result: MagicMock) -> None:
        self._execute_result = result

    async def execute(self, query: object) -> MagicMock:
        return self._execute_result  # type: ignore

    def add(self, obj: object) -> None:
        pass

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: object) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    """モックDBセッション"""
    return MockDBSession()


async def create_db_override(
    mock_db: MockDBSession,
) -> AsyncGenerator[MockDBSession, None]:
    """DB依存性オーバーライド用ジェネレータ"""
    yield mock_db


@pytest.mark.asyncio
async def test_get_questions_empty(mock_db: MockDBSession) -> None:
    """問題一覧取得（空の場合）"""
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions")

        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_questions_with_data(mock_db: MockDBSession) -> None:
    """問題一覧取得（データがある場合）"""
    mock_question = MockQuestion()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [mock_question]
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["content"] == "テスト問題"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_question_by_id(mock_db: MockDBSession) -> None:
    """問題詳細取得"""
    mock_question = MockQuestion()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_question
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(f"/api/questions/{mock_question.id}")

        assert response.status_code == 200
        assert response.json()["id"] == str(mock_question.id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_question_not_found(mock_db: MockDBSession) -> None:
    """存在しない問題を取得"""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(f"/api/questions/{uuid.uuid4()}")

        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_random_question(mock_db: MockDBSession) -> None:
    """ランダム問題取得"""
    mock_question = MockQuestion()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_question
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/random")

        assert response.status_code == 200
        assert response.json()["content"] == "テスト問題"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_question(mock_db: MockDBSession) -> None:
    """問題作成"""
    category_id = uuid.uuid4()
    question_data = {
        "category_id": str(category_id),
        "content": "新しい問題",
        "choices": ["A", "B", "C", "D"],
        "correct_answer": 2,
        "explanation": "解説",
        "difficulty": 4,
        "source": "テスト",
    }

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post("/api/questions", json=question_data)

        assert response.status_code == 201
        assert response.json()["content"] == "新しい問題"
    finally:
        app.dependency_overrides.clear()


# デフォルトカテゴリのテスト
from app.api.questions import DEFAULT_CATEGORY_NAME, get_or_create_default_category


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(self, name: str = "未分類") -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = None


class MockDBSessionForDefaultCategory:
    """デフォルトカテゴリテスト用のモックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._execute_index = 0
        self.added_objects: list[object] = []
        self.flushed = False

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
        self.flushed = True

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: object) -> None:
        pass


@pytest.mark.asyncio
async def test_get_or_create_default_category_when_exists() -> None:
    """デフォルトカテゴリが既に存在する場合、そのIDを返す"""
    mock_db = MockDBSessionForDefaultCategory()
    existing_category = MockCategory(name=DEFAULT_CATEGORY_NAME)

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_category
    mock_db.set_execute_results([mock_result])

    category_id = await get_or_create_default_category(mock_db)  # type: ignore

    assert category_id == existing_category.id
    assert len(mock_db.added_objects) == 0  # 新規作成されていない


@pytest.mark.asyncio
async def test_get_or_create_default_category_when_not_exists() -> None:
    """デフォルトカテゴリが存在しない場合、新規作成してIDを返す"""
    mock_db = MockDBSessionForDefaultCategory()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.set_execute_results([mock_result])

    category_id = await get_or_create_default_category(mock_db)  # type: ignore

    assert category_id is not None
    assert len(mock_db.added_objects) == 1  # 新規作成された
    assert mock_db.added_objects[0].name == DEFAULT_CATEGORY_NAME  # type: ignore
    assert mock_db.flushed  # flushが呼ばれた


@pytest.mark.asyncio
async def test_default_category_name_constant() -> None:
    """DEFAULT_CATEGORY_NAMEが正しい値を持つ"""
    assert DEFAULT_CATEGORY_NAME == "未分類"


class MockQuestionImage:
    """テスト用の問題画像モック"""

    def __init__(self, question_id: uuid.UUID | None = None) -> None:
        self.id = uuid.uuid4()
        self.question_id = question_id or uuid.uuid4()
        self.file_path = "/static/images/test.png"
        self.alt_text = "テスト画像"
        self.position = 0
        self.image_type = "diagram"


@pytest.mark.asyncio
async def test_get_random_question_with_images(mock_db: MockDBSession) -> None:
    """画像を持つ問題のimagesリレーションがロードされる"""
    mock_question = MockQuestion()
    # 画像を追加
    mock_image = MockQuestionImage(question_id=mock_question.id)
    mock_question.images = [mock_image]

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_question
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/questions/random")

        assert response.status_code == 200
        data = response.json()
        assert "images" in data
        assert len(data["images"]) == 1
        assert data["images"][0]["alt_text"] == "テスト画像"
        assert data["images"][0]["image_type"] == "diagram"
    finally:
        app.dependency_overrides.clear()
