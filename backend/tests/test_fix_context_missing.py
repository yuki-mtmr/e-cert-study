"""文脈欠落問題修正スクリプトのピュア関数テスト

build_content_prompt, validate_generated_content, normalize_choice_parens,
_extract_markers_from_choices のロジックをテストする。DB操作は含まない。
"""
import pytest

from scripts.fix_context_missing import (
    build_content_prompt,
    validate_generated_content,
    normalize_choice_parens,
    _extract_markers_from_choices,
    _compute_content_hash,
)


class TestBuildContentPrompt:
    """Claude CLIに送るプロンプト生成のテスト"""

    def test_includes_content(self):
        prompt = build_content_prompt(
            content="正しい説明を選べ。",
            choices=["(あ)マクロ平均は...", "(い)サンプル数が..."],
            correct_answer=0,
            explanation="マクロ平均の解説",
        )
        assert "正しい説明を選べ。" in prompt

    def test_includes_choices(self):
        choices = ["(あ)マクロ平均は...", "(い)サンプル数が..."]
        prompt = build_content_prompt(
            content="正しい説明を選べ。",
            choices=choices,
            correct_answer=0,
            explanation="解説",
        )
        assert "(あ)マクロ平均は..." in prompt
        assert "(い)サンプル数が..." in prompt

    def test_includes_correct_answer_label(self):
        prompt = build_content_prompt(
            content="正しい説明を選べ。",
            choices=["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
            correct_answer=2,
            explanation="解説",
        )
        assert "【正解】C" in prompt

    def test_includes_explanation(self):
        prompt = build_content_prompt(
            content="問題文",
            choices=["A", "B"],
            correct_answer=0,
            explanation="詳しい解説テキスト",
        )
        assert "詳しい解説テキスト" in prompt

    def test_includes_markers_instruction(self):
        """マーカーが問題文に自然に登場するよう指示が含まれること"""
        prompt = build_content_prompt(
            content="問題文",
            choices=["(あ)X", "(い)Y"],
            correct_answer=0,
            explanation="解説",
        )
        assert "マーカー" in prompt
        assert "穴埋め" in prompt

    def test_four_choices(self):
        choices = ["(あ)X (い)Y", "(あ)X (い)Z", "(あ)W (い)Y", "(あ)W (い)Z"]
        prompt = build_content_prompt(
            content="問題文",
            choices=choices,
            correct_answer=1,
            explanation="解説",
        )
        assert "A." in prompt
        assert "B." in prompt
        assert "C." in prompt
        assert "D." in prompt


class TestExtractMarkersFromChoices:
    """選択肢からのマーカー抽出テスト"""

    def test_no_markers(self):
        result = _extract_markers_from_choices(["選択肢A", "選択肢B"])
        assert result == []

    def test_halfwidth_markers(self):
        result = _extract_markers_from_choices(["(あ)X(い)Y", "(あ)Z(い)W"])
        assert result == ["あ", "い"]

    def test_fullwidth_markers(self):
        result = _extract_markers_from_choices(["（あ）X（い）Y"])
        assert result == ["あ", "い"]

    def test_mixed_width(self):
        result = _extract_markers_from_choices(["(あ)X（い）Y"])
        assert result == ["あ", "い"]

    def test_katakana_markers(self):
        result = _extract_markers_from_choices(["(ア)X(イ)Y"])
        assert result == ["ア", "イ"]

    def test_deduplication(self):
        """複数選択肢に同じマーカーがあっても重複しない"""
        result = _extract_markers_from_choices(["(あ)X", "(あ)Y", "(あ)Z"])
        assert result == ["あ"]

    def test_three_markers(self):
        result = _extract_markers_from_choices(["(あ)X(い)Y(う)Z"])
        assert result == ["あ", "い", "う"]


class TestValidateGeneratedContent:
    """生成されたcontentの検証テスト"""

    def test_valid_content_fullwidth(self):
        """全角マーカーがcontentと選択肢両方にある → True"""
        result = validate_generated_content(
            new_content="（あ）はXであり、（い）はYである。正しい組合せを選べ。",
            choices=["（あ）X（い）Y", "（あ）X（い）Z"],
        )
        assert result is True

    def test_valid_content_halfwidth(self):
        """半角マーカーがcontentに含まれていても許容 → True"""
        result = validate_generated_content(
            new_content="(あ)はXであり、(い)はYである。正しい組合せを選べ。",
            choices=["(あ)X(い)Y", "(あ)X(い)Z"],
        )
        assert result is True

    def test_fullwidth_halfwidth_tolerance(self):
        """選択肢が半角で、contentが全角でも許容 → True"""
        result = validate_generated_content(
            new_content="（あ）はXであり、（い）はYである。",
            choices=["(あ)X(い)Y", "(あ)X(い)Z"],
        )
        assert result is True

    def test_halfwidth_fullwidth_tolerance(self):
        """選択肢が全角で、contentが半角でも許容 → True"""
        result = validate_generated_content(
            new_content="(あ)はXであり、(い)はYである。",
            choices=["（あ）X（い）Y", "（あ）X（い）Z"],
        )
        assert result is True

    def test_missing_marker(self):
        """マーカーが1つ欠けている → False"""
        result = validate_generated_content(
            new_content="（あ）はXである。正しいものを選べ。",
            choices=["(あ)X(い)Y", "(あ)X(い)Z"],
        )
        assert result is False

    def test_empty_content(self):
        """空文字 → False"""
        result = validate_generated_content(
            new_content="",
            choices=["(あ)X(い)Y"],
        )
        assert result is False

    def test_no_markers_in_choices(self):
        """選択肢にマーカーがない場合 → True（チェック不要）"""
        result = validate_generated_content(
            new_content="通常の問題文",
            choices=["選択肢A", "選択肢B"],
        )
        assert result is True

    def test_three_markers(self):
        """3つのマーカー（あ）（い）（う）が全て含まれている → True"""
        result = validate_generated_content(
            new_content="（あ）はX、（い）はY、（う）はZである。",
            choices=["(あ)X(い)Y(う)Z"],
        )
        assert result is True

    def test_three_markers_one_missing(self):
        """3つ中1つ欠けている → False"""
        result = validate_generated_content(
            new_content="（あ）はX、（い）はYである。",
            choices=["(あ)X(い)Y(う)Z"],
        )
        assert result is False


class TestNormalizeChoiceParens:
    """選択肢の括弧スタイル統一テスト"""

    def test_half_to_full(self):
        """半角→全角"""
        choices = ["(あ)X(い)Y", "(あ)Z(い)W"]
        result = normalize_choice_parens(choices, target_style="full")
        assert result == ["（あ）X（い）Y", "（あ）Z（い）W"]

    def test_full_to_half(self):
        """全角→半角"""
        choices = ["（あ）X（い）Y", "（あ）Z（い）W"]
        result = normalize_choice_parens(choices, target_style="half")
        assert result == ["(あ)X(い)Y", "(あ)Z(い)W"]

    def test_no_markers(self):
        """マーカーなしの選択肢はそのまま"""
        choices = ["選択肢A", "選択肢B"]
        result = normalize_choice_parens(choices, target_style="full")
        assert result == ["選択肢A", "選択肢B"]

    def test_mixed_markers(self):
        """半角と全角が混在 → target_styleに統一"""
        choices = ["(あ)X（い）Y", "（あ）Z(い)W"]
        result = normalize_choice_parens(choices, target_style="full")
        assert result == ["（あ）X（い）Y", "（あ）Z（い）W"]

    def test_katakana_markers(self):
        """カタカナマーカーも変換"""
        choices = ["(ア)X(イ)Y"]
        result = normalize_choice_parens(choices, target_style="full")
        assert result == ["（ア）X（イ）Y"]

    def test_already_target_style(self):
        """既にtarget_styleの場合は変化なし"""
        choices = ["（あ）X（い）Y"]
        result = normalize_choice_parens(choices, target_style="full")
        assert result == ["（あ）X（い）Y"]


class TestComputeContentHash:
    """content_hash計算のテスト"""

    def test_returns_32_chars(self):
        result = _compute_content_hash("テスト問題文")
        assert len(result) == 32

    def test_deterministic(self):
        result1 = _compute_content_hash("同じ文字列")
        result2 = _compute_content_hash("同じ文字列")
        assert result1 == result2

    def test_different_content_different_hash(self):
        result1 = _compute_content_hash("問題文A")
        result2 = _compute_content_hash("問題文B")
        assert result1 != result2
