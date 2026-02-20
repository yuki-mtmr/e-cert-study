"""importエンドポイントのper-questionカテゴリ振り分けテスト"""
import uuid

import pytest

from app.services.question_service import resolve_category_id


class TestResolveCategoryId:
    """カテゴリ名からIDを解決する関数のテスト"""

    def test_exact_match(self) -> None:
        """正確なカテゴリ名でIDを解決できる"""
        cat_id = uuid.uuid4()
        category_map = {"CNN": cat_id}
        result = resolve_category_id("CNN", category_map)
        assert result == cat_id

    def test_unknown_category_returns_none(self) -> None:
        """不明なカテゴリ名はNoneを返す"""
        category_map = {"CNN": uuid.uuid4()}
        result = resolve_category_id("存在しないカテゴリ", category_map)
        assert result is None

    def test_empty_category_name_returns_none(self) -> None:
        """空のカテゴリ名はNoneを返す"""
        category_map = {"CNN": uuid.uuid4()}
        result = resolve_category_id("", category_map)
        assert result is None

    def test_none_category_name_returns_none(self) -> None:
        """Noneのカテゴリ名はNoneを返す"""
        category_map = {"CNN": uuid.uuid4()}
        result = resolve_category_id(None, category_map)
        assert result is None

    def test_parent_category_match(self) -> None:
        """親カテゴリ名でもIDを解決できる"""
        parent_id = uuid.uuid4()
        category_map = {"応用数学": parent_id, "線形代数": uuid.uuid4()}
        result = resolve_category_id("応用数学", category_map)
        assert result == parent_id

    def test_all_e_cert_categories(self) -> None:
        """全E資格カテゴリがマッピングから解決できる"""
        from app.api.categories import E_CERT_CATEGORIES

        category_map: dict[str, uuid.UUID] = {}
        for parent, children in E_CERT_CATEGORIES.items():
            category_map[parent] = uuid.uuid4()
            for child in children:
                category_map[child] = uuid.uuid4()

        for name, expected_id in category_map.items():
            result = resolve_category_id(name, category_map)
            assert result == expected_id, f"Failed to resolve: {name}"
