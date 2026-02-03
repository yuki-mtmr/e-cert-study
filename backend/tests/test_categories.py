"""カテゴリAPIエンドポイントのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(
        self,
        name: str = "テストカテゴリ",
        parent_id: uuid.UUID | None = None,
    ) -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = parent_id
        self.children: list["MockCategory"] = []
        self.parent: "MockCategory | None" = None


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._execute_index = 0
        self.added_objects: list[object] = []
        self.committed = False
        self.flushed = False

    def set_execute_result(self, result: MagicMock) -> None:
        self._execute_results = [result]
        self._execute_index = 0

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

    async def commit(self) -> None:
        self.committed = True

    async def flush(self) -> None:
        self.flushed = True

    async def refresh(self, obj: object) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    """モックDBセッション"""
    return MockDBSession()


# E資格カテゴリ構成の定数
E_CERT_CATEGORIES = {
    "応用数学": ["線形代数", "確率・統計", "情報理論"],
    "機械学習": ["教師あり学習", "教師なし学習", "評価指標"],
    "深層学習": [
        "順伝播型ニューラルネットワーク",
        "CNN",
        "RNN",
        "Transformer",
        "生成モデル",
        "強化学習",
    ],
}


class TestSeedCategories:
    """カテゴリシードAPIのテスト"""

    @pytest.mark.asyncio
    async def test_seed_categories_creates_all_categories(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """シードAPIが全てのE資格カテゴリを作成する"""
        # 既存カテゴリがないことを示すモック
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
                response = await client.post("/api/categories/seed")

            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "created_count" in data
            # 親3 + 子12 = 15カテゴリ
            assert data["created_count"] == 15
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_seed_categories_skips_existing(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """既にカテゴリが存在する場合はスキップする"""
        # 既存カテゴリがあることを示すモック
        existing = MockCategory(name="応用数学")
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [existing]
        mock_db.set_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post("/api/categories/seed")

            assert response.status_code == 200
            data = response.json()
            assert data["created_count"] == 0
            assert "already exists" in data["message"].lower() or "既" in data["message"]
        finally:
            app.dependency_overrides.clear()


class TestGetCategoriesTree:
    """カテゴリツリー取得APIのテスト"""

    @pytest.mark.asyncio
    async def test_get_categories_tree_empty(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """空の場合は空のリストを返す"""
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
                response = await client.get("/api/categories/tree")

            assert response.status_code == 200
            assert response.json() == []
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_categories_tree_with_question_count(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """カテゴリツリーに問題数が含まれる"""
        # 親カテゴリ
        parent = MockCategory(name="応用数学")
        # 子カテゴリ
        child1 = MockCategory(name="線形代数", parent_id=parent.id)
        child1.parent = parent
        child2 = MockCategory(name="確率・統計", parent_id=parent.id)
        child2.parent = parent
        parent.children = [child1, child2]

        # カテゴリ取得結果
        mock_category_result = MagicMock()
        mock_category_result.scalars.return_value.all.return_value = [parent, child1, child2]

        # 問題数カウント結果: (category_id, count)
        mock_count_result = MagicMock()
        mock_count_result.all.return_value = [
            (parent.id, 10),
            (child1.id, 5),
            (child2.id, 5),
        ]

        mock_db.set_execute_results([mock_category_result, mock_count_result])

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.get("/api/categories/tree")

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "応用数学"
            assert "questionCount" in data[0] or "question_count" in data[0]
            # 問題数が含まれていることを確認
            question_count = data[0].get("questionCount") or data[0].get("question_count")
            assert question_count == 10
            # 子カテゴリにも問題数が含まれている
            child_count = (
                data[0]["children"][0].get("questionCount")
                or data[0]["children"][0].get("question_count")
            )
            assert child_count == 5
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_categories_tree_with_hierarchy(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """階層構造でカテゴリを返す"""
        # 親カテゴリ
        parent = MockCategory(name="応用数学")
        # 子カテゴリ
        child1 = MockCategory(name="線形代数", parent_id=parent.id)
        child1.parent = parent
        child2 = MockCategory(name="確率・統計", parent_id=parent.id)
        child2.parent = parent
        parent.children = [child1, child2]

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [parent, child1, child2]
        mock_db.set_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.get("/api/categories/tree")

            assert response.status_code == 200
            data = response.json()
            # ルートカテゴリのみが含まれる
            assert len(data) == 1
            assert data[0]["name"] == "応用数学"
            assert "children" in data[0]
            assert len(data[0]["children"]) == 2
        finally:
            app.dependency_overrides.clear()


class TestGetCategories:
    """カテゴリ一覧取得APIのテスト"""

    @pytest.mark.asyncio
    async def test_get_categories_empty(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """空の場合は空のリストを返す"""
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
                response = await client.get("/api/categories")

            assert response.status_code == 200
            assert response.json() == []
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_categories_with_data(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """カテゴリ一覧を取得"""
        category = MockCategory(name="テストカテゴリ")
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [category]
        mock_db.set_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.get("/api/categories")

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["name"] == "テストカテゴリ"
        finally:
            app.dependency_overrides.clear()


class TestGetCategoryById:
    """カテゴリ詳細取得APIのテスト"""

    @pytest.mark.asyncio
    async def test_get_category_by_id(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """IDでカテゴリを取得"""
        category = MockCategory(name="テストカテゴリ")
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = category
        mock_db.set_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.get(f"/api/categories/{category.id}")

            assert response.status_code == 200
            assert response.json()["name"] == "テストカテゴリ"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_category_not_found(
        self,
        mock_db: MockDBSession,
    ) -> None:
        """存在しないカテゴリを取得"""
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
                response = await client.get(f"/api/categories/{uuid.uuid4()}")

            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()


class MockDBSessionForCreate:
    """カテゴリ作成テスト用のモックDBセッション"""

    def __init__(self, category_id: uuid.UUID, parent_id: uuid.UUID | None = None) -> None:
        self._category_id = category_id
        self._parent_id = parent_id
        self.added_objects: list[object] = []

    async def execute(self, query: object) -> MagicMock:
        return MagicMock()

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: object) -> None:
        # refreshでIDを設定
        setattr(obj, "id", self._category_id)
        if self._parent_id:
            setattr(obj, "parent_id", self._parent_id)


class TestCreateCategory:
    """カテゴリ作成APIのテスト"""

    @pytest.mark.asyncio
    async def test_create_category(self) -> None:
        """カテゴリを作成"""
        category_id = uuid.uuid4()
        mock_db = MockDBSessionForCreate(category_id)

        async def override_get_db() -> AsyncGenerator[MockDBSessionForCreate, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/categories",
                    json={"name": "新しいカテゴリ"},
                )

            assert response.status_code == 201
            assert response.json()["name"] == "新しいカテゴリ"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_create_category_with_parent(self) -> None:
        """親カテゴリを指定してカテゴリを作成"""
        parent_id = uuid.uuid4()
        child_id = uuid.uuid4()
        mock_db = MockDBSessionForCreate(child_id, parent_id)

        async def override_get_db() -> AsyncGenerator[MockDBSessionForCreate, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/categories",
                    json={
                        "name": "子カテゴリ",
                        "parent_id": str(parent_id),
                    },
                )

            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "子カテゴリ"
            assert data["parent_id"] == str(parent_id)
        finally:
            app.dependency_overrides.clear()
