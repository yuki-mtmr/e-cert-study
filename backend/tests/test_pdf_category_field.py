"""PDF抽出時のcategoryフィールドテスト

Sprint 0: EXTRACTION_PROMPTにcategoryフィールドが含まれることを検証
"""
from app.services.pdf_extractor import EXTRACTION_PROMPT


class TestExtractionPromptCategory:
    """EXTRACTION_PROMPTのcategoryフィールドテスト"""

    def test_prompt_includes_category_field(self) -> None:
        """JSONフォーマットにcategoryフィールドが含まれること"""
        assert '"category"' in EXTRACTION_PROMPT

    def test_prompt_includes_category_options(self) -> None:
        """プロンプトにカテゴリ選択肢が含まれること"""
        expected_categories = [
            "線形代数", "確率・統計", "情報理論",
            "教師あり学習", "教師なし学習", "評価指標",
            "順伝播型ニューラルネットワーク", "CNN", "RNN",
            "Transformer", "生成モデル", "強化学習",
            "ミドルウェア", "フレームワーク", "計算リソース",
            "データ収集・加工", "MLOps",
        ]
        for cat in expected_categories:
            assert cat in EXTRACTION_PROMPT, f"{cat} がEXTRACTION_PROMPTに含まれていない"

    def test_prompt_includes_chapter_hint(self) -> None:
        """PDFの目次・章構造を参考にする指示が含まれること"""
        assert "目次" in EXTRACTION_PROMPT or "章構造" in EXTRACTION_PROMPT
