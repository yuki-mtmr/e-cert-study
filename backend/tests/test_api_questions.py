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

    # 作成後の再取得用モック
    mock_question = MockQuestion()
    mock_question.content = "新しい問題"
    mock_question.category_id = category_id
    mock_result = MagicMock()
    mock_result.scalar_one.return_value = mock_question
    mock_db.set_execute_result(mock_result)

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
from app.services.question_service import DEFAULT_CATEGORY_NAME, get_or_create_default_category


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


class TestDeleteAllQuestions:
    """全問題削除APIのテスト"""

    @pytest.mark.asyncio
    async def test_delete_all_questions_success(self) -> None:
        """全問題削除が成功する"""
        mock_db = MockDBSession()

        # 削除対象の問題数を返すモック
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 10
        mock_db.set_execute_result(mock_count_result)

        async def mock_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = mock_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.delete(
                    "/api/questions/all",
                    params={
                        "confirm": "DELETE_ALL_QUESTIONS",
                        "clear_cache": True,
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert "deleted_count" in data
            assert "cache_cleared" in data
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_delete_all_questions_requires_confirm_token(self) -> None:
        """確認トークンなしでは422エラー"""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.delete("/api/questions/all")

        # confirmパラメータが必須
        assert response.status_code == 422


class TestUpdateQuestionCategory:
    """問題カテゴリ更新APIのテスト"""

    @pytest.mark.asyncio
    async def test_update_question_category(self) -> None:
        """問題のカテゴリを更新できる"""
        mock_db = MockDBSession()
        question = MockQuestion()
        new_category_id = uuid.uuid4()

        # 問題を取得するモック
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = question
        mock_db.set_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.patch(
                    f"/api/questions/{question.id}/category",
                    json={"category_id": str(new_category_id)},
                )

            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "category_id" in data
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_update_question_category_not_found(self) -> None:
        """存在しない問題のカテゴリ更新は404"""
        mock_db = MockDBSession()

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
                response = await client.patch(
                    f"/api/questions/{uuid.uuid4()}/category",
                    json={"category_id": str(uuid.uuid4())},
                )

            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()


class TestAutoClassifyQuestions:
    """問題自動分類APIのテスト"""

    @pytest.mark.asyncio
    async def test_auto_classify_returns_stats(self) -> None:
        """自動分類APIが統計を返す"""
        mock_db = MockDBSessionForDefaultCategory()

        # 「未分類」カテゴリと問題を返すモック
        mock_category = MockCategory(name="未分類")
        mock_question = MockQuestion()
        mock_question.category_id = mock_category.id

        # 1回目: カテゴリ一覧取得
        mock_result1 = MagicMock()
        mock_result1.scalars.return_value.all.return_value = [mock_category]

        # 2回目: 未分類問題取得
        mock_result2 = MagicMock()
        mock_result2.scalars.return_value.all.return_value = [mock_question]

        mock_db.set_execute_results([mock_result1, mock_result2])

        async def override_get_db() -> AsyncGenerator[MockDBSessionForDefaultCategory, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/auto-classify",
                    params={"dry_run": True},
                )

            assert response.status_code == 200
            data = response.json()
            assert "total" in data
            assert "classified" in data
            assert "failed" in data
        finally:
            app.dependency_overrides.clear()
