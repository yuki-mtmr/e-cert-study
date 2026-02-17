"""調査用ピュア診断関数のテスト

diagnose_duplicate_choices, diagnose_missing_context, diagnose_unnecessary_images
のユニットテストを行う。DB接続不要。
"""
import pytest

from scripts.investigate_reported_questions import (
    diagnose_duplicate_choices,
    diagnose_missing_context,
    diagnose_unnecessary_images,
)


class TestDiagnoseDuplicateChoices:
    """重複選択肢の診断テスト"""

    def test_no_duplicates(self):
        choices = ["A", "B", "C", "D"]
        result = diagnose_duplicate_choices(choices)
        assert result == []

    def test_exact_duplicates(self):
        choices = ["MAE", "MAE", "RMSE", "MSE"]
        result = diagnose_duplicate_choices(choices)
        assert len(result) == 1
        assert result[0]["value"] == "MAE"
        assert result[0]["indices"] == [0, 1]

    def test_multiple_duplicates(self):
        choices = ["A", "A", "B", "B"]
        result = diagnose_duplicate_choices(choices)
        assert len(result) == 2

    def test_empty_choices(self):
        result = diagnose_duplicate_choices([])
        assert result == []

    def test_all_same(self):
        choices = ["X", "X", "X", "X"]
        result = diagnose_duplicate_choices(choices)
        assert len(result) == 1
        assert result[0]["indices"] == [0, 1, 2, 3]


class TestDiagnoseMissingContext:
    """文脈欠落の診断テスト"""

    def test_context_present(self):
        content = "次の文で(あ)と(い)に入る語句の組合せを選べ。"
        choices = ["(あ)回帰 (い)分類", "(あ)分類 (い)回帰"]
        result = diagnose_missing_context(content, choices)
        assert result is None

    def test_context_missing(self):
        content = "正しい組合せを選べ。"
        choices = ["(あ)回帰 (い)分類", "(あ)分類 (い)回帰"]
        result = diagnose_missing_context(content, choices)
        assert result is not None
        assert "(あ)" in result["missing_markers"]

    def test_no_markers_in_choices(self):
        content = "正しいものを選べ。"
        choices = ["A", "B", "C", "D"]
        result = diagnose_missing_context(content, choices)
        assert result is None

    def test_katakana_markers(self):
        content = "正しい組合せを選べ。"
        choices = ["(ア)回帰 (イ)分類"]
        result = diagnose_missing_context(content, choices)
        assert result is not None

    def test_content_has_markers(self):
        """contentに(あ)(い)が含まれていれば問題なし"""
        content = "(あ)はXXXであり、(い)はYYYである。正しい組合せを選べ。"
        choices = ["(あ)回帰 (い)分類"]
        result = diagnose_missing_context(content, choices)
        assert result is None


class TestDiagnoseUnnecessaryImages:
    """不要画像の診断テスト"""

    def test_no_images(self):
        content = "問題文"
        images: list[dict] = []
        result = diagnose_unnecessary_images(content, images)
        assert result == []

    def test_image_referenced(self):
        content = "下図を参照して答えよ。![図1](image.png)"
        images = [{"file_path": "image.png", "alt_text": "図1"}]
        result = diagnose_unnecessary_images(content, images)
        assert result == []

    def test_image_referenced_by_keyword(self):
        """「図」「画像」「グラフ」等のキーワードがcontentにあれば参照とみなす"""
        content = "以下の図を参照して答えよ。"
        images = [{"file_path": "img.png", "alt_text": None}]
        result = diagnose_unnecessary_images(content, images)
        assert result == []

    def test_unnecessary_image(self):
        """画像参照キーワードもmarkdownリンクもない場合は不要"""
        content = "ユークリッド距離について正しいものを選べ。"
        images = [{"file_path": "img.png", "alt_text": None}]
        result = diagnose_unnecessary_images(content, images)
        assert len(result) == 1
        assert result[0]["file_path"] == "img.png"

    def test_multiple_images_some_unnecessary(self):
        content = "以下の図を見て答えよ。"
        images = [
            {"file_path": "fig1.png", "alt_text": None},
            {"file_path": "fig2.png", "alt_text": None},
        ]
        # 「図」キーワードがあるため全て参照とみなす
        result = diagnose_unnecessary_images(content, images)
        assert result == []

    def test_no_reference_keywords(self):
        """画像関連キーワードが一切ない場合、全画像が不要"""
        content = "畳み込み演算カーネルについて述べよ。"
        images = [
            {"file_path": "img1.png", "alt_text": None},
            {"file_path": "img2.png", "alt_text": None},
        ]
        result = diagnose_unnecessary_images(content, images)
        assert len(result) == 2
