"""カテゴリ再編テスト

Sprint 0: E_CERT_CATEGORIESの5分野構成と分類器の更新を検証
"""
from app.api.categories import E_CERT_CATEGORIES
from app.services.category_classifier import E_CERT_CATEGORY_NAMES, CLASSIFICATION_PROMPT


class TestECertCategories:
    """E_CERT_CATEGORIES構造テスト"""

    def test_has_five_parent_categories(self) -> None:
        """5つの親カテゴリが存在すること"""
        assert len(E_CERT_CATEGORIES) == 5

    def test_parent_category_names(self) -> None:
        """親カテゴリ名が正しいこと"""
        expected = {"応用数学", "機械学習", "深層学習の基礎", "深層学習の応用", "開発・運用環境"}
        assert set(E_CERT_CATEGORIES.keys()) == expected

    def test_applied_math_children(self) -> None:
        """応用数学の子カテゴリが正しいこと"""
        assert E_CERT_CATEGORIES["応用数学"] == ["線形代数", "確率・統計", "情報理論"]

    def test_machine_learning_children(self) -> None:
        """機械学習の子カテゴリが正しいこと"""
        assert E_CERT_CATEGORIES["機械学習"] == ["教師あり学習", "教師なし学習", "評価指標"]

    def test_deep_learning_basic_children(self) -> None:
        """深層学習の基礎の子カテゴリが正しいこと"""
        assert E_CERT_CATEGORIES["深層学習の基礎"] == [
            "順伝播型ニューラルネットワーク", "CNN", "RNN"
        ]

    def test_deep_learning_advanced_children(self) -> None:
        """深層学習の応用の子カテゴリが正しいこと"""
        assert E_CERT_CATEGORIES["深層学習の応用"] == [
            "Transformer", "生成モデル", "強化学習"
        ]

    def test_dev_ops_children(self) -> None:
        """開発・運用環境の子カテゴリが正しいこと"""
        assert E_CERT_CATEGORIES["開発・運用環境"] == [
            "ミドルウェア", "フレームワーク", "計算リソース", "データ収集・加工", "MLOps"
        ]

    def test_total_child_categories(self) -> None:
        """子カテゴリの合計が正しいこと"""
        total = sum(len(children) for children in E_CERT_CATEGORIES.values())
        assert total == 17  # 3+3+3+3+5 = 17


class TestCategoryClassifier:
    """分類器の新カテゴリ対応テスト"""

    def test_category_names_include_dev_ops(self) -> None:
        """E_CERT_CATEGORY_NAMESに開発・運用環境系カテゴリが含まれること"""
        dev_ops_categories = ["ミドルウェア", "フレームワーク", "計算リソース", "データ収集・加工", "MLOps"]
        for cat in dev_ops_categories:
            assert cat in E_CERT_CATEGORY_NAMES, f"{cat} がE_CERT_CATEGORY_NAMESに含まれていない"

    def test_category_names_include_new_parents(self) -> None:
        """フォールバック用親カテゴリに新カテゴリが含まれること"""
        assert "深層学習の基礎" in E_CERT_CATEGORY_NAMES
        assert "深層学習の応用" in E_CERT_CATEGORY_NAMES
        assert "開発・運用環境" in E_CERT_CATEGORY_NAMES

    def test_old_deep_learning_parent_removed(self) -> None:
        """旧「深層学習」親カテゴリが削除されていること"""
        assert "深層学習" not in E_CERT_CATEGORY_NAMES

    def test_classification_prompt_includes_dev_ops(self) -> None:
        """分類プロンプトに開発・運用環境カテゴリが含まれること"""
        assert "ミドルウェア" in CLASSIFICATION_PROMPT
        assert "フレームワーク" in CLASSIFICATION_PROMPT
        assert "MLOps" in CLASSIFICATION_PROMPT

    def test_all_child_categories_in_names(self) -> None:
        """全子カテゴリがE_CERT_CATEGORY_NAMESに含まれること"""
        all_children = []
        for children in E_CERT_CATEGORIES.values():
            all_children.extend(children)
        for child in all_children:
            assert child in E_CERT_CATEGORY_NAMES, f"{child} がE_CERT_CATEGORY_NAMESに含まれていない"
