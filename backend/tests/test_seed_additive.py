"""seed APIエンドポイントの追加型動作テスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.api.categories import E_CERT_CATEGORIES


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(self, name: str, parent_id: uuid.UUID | None = None) -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = parent_id


class MockDBSessionAdditive:
    """追加型seed用モックDBセッション

    seed APIの呼び出しパターン:
    1. select(Category.name) → 既存カテゴリ名リスト（文字列）
    2. 既存親カテゴリごとに select(Category).where(...) → MockCategory
    """

    def __init__(self, existing_names: set[str] | None = None) -> None:
        self.existing_names = existing_names or set()
        self.added_objects: list[object] = []
        self._call_count = 0
        # 親カテゴリのモックオブジェクトをキャッシュ
        self._parent_mocks: dict[str, MockCategory] = {}
        for name in self.existing_names:
            self._parent_mocks[name] = MockCategory(name=name)

    async def execute(self, query: object) -> MagicMock:
        self._call_count += 1
        if self._call_count == 1:
            # 最初: select(Category.name) → 文字列リスト
            result = MagicMock()
            result.scalars.return_value.all.return_value = list(self.existing_names)
            return result
        # 以降: 既存親カテゴリの取得 select(Category).where(name==...)
        result = MagicMock()
        cat = MockCategory(name="existing")
        result.scalar_one.return_value = cat
        return result

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def commit(self) -> None:
        pass

    async def flush(self) -> None:
        pass


class TestSeedAdditive:
    """seed APIの追加型動作テスト"""

    @pytest.mark.asyncio
    async def test_seed_adds_new_categories_when_some_exist(self) -> None:
        """旧カテゴリが存在する場合でも新カテゴリを追加する"""
        # 旧3カテゴリ構造が既に存在
        existing = {
            "応用数学", "線形代数", "確率・統計", "情報理論",
            "機械学習", "教師あり学習", "教師なし学習", "評価指標",
            "深層学習", "順伝播型ニューラルネットワーク", "CNN", "RNN",
            "Transformer", "生成モデル", "強化学習",
        }
        mock_db = MockDBSessionAdditive(existing_names=existing)

        async def override_get_db() -> AsyncGenerator[MockDBSessionAdditive, None]:
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
            # 新しいカテゴリが追加される:
            # 深層学習の基礎, 深層学習の応用, 開発・運用環境 (3親)
            # ミドルウェア, フレームワーク, 計算リソース, データ収集・加工, MLOps (5子)
            # = 8カテゴリ
            assert data["created_count"] == 8
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_seed_empty_db_creates_all(self) -> None:
        """空DBでは全22カテゴリを作成する"""
        mock_db = MockDBSessionAdditive(existing_names=set())

        async def override_get_db() -> AsyncGenerator[MockDBSessionAdditive, None]:
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
            # 5親 + 17子 = 22
            assert data["created_count"] == 22
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_seed_all_exist_creates_zero(self) -> None:
        """全カテゴリが既に存在する場合は0件作成"""
        all_names: set[str] = set()
        for parent, children in E_CERT_CATEGORIES.items():
            all_names.add(parent)
            all_names.update(children)

        mock_db = MockDBSessionAdditive(existing_names=all_names)

        async def override_get_db() -> AsyncGenerator[MockDBSessionAdditive, None]:
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
            assert "既" in data["message"]
        finally:
            app.dependency_overrides.clear()
