"""LIME問題の文脈欠落修正スクリプトのテスト

find_lime_question, build_lime_prompt, validate_lime_content のロジックをテスト。
DB操作は含まない。
"""
import pytest

from scripts.fix_lime_question import (
    find_lime_questions,
    build_lime_prompt,
    validate_lime_content,
)
from scripts.fix_context_missing import _compute_content_hash


class TestFindLimeQuestions:
    """LIME問題の特定ロジックテスト"""

    def test_detects_lime_with_ア_イ_markers(self) -> None:
        """contentにLIMEがあり選択肢に(ア)(イ)マーカーがある問題を検出"""
        rows = [
            (
                "uuid-1",
                "LIME（局所的な解釈可能なモデル非依存の説明）に関する記述として正しいものを選べ。",
                [
                    "(ア)線形回帰 (イ)決定境界",
                    "(ア)線形回帰 (イ)特徴量",
                    "(ア)ロジスティック回帰 (イ)決定境界",
                    "(ア)ロジスティック回帰 (イ)特徴量",
                ],
                1,
                "LIMEの説明モデルは線形回帰で...",
            ),
        ]
        result = find_lime_questions(rows)
        assert len(result) == 1
        assert result[0]["id"] == "uuid-1"

    def test_ignores_non_lime_question(self) -> None:
        """LIMEを含まない問題は検出しない"""
        rows = [
            (
                "uuid-2",
                "CNNに関する記述として正しいものを選べ。",
                [
                    "(ア)畳み込み (イ)プーリング",
                    "(ア)畳み込み (イ)全結合",
                ],
                0,
                "CNNの解説",
            ),
        ]
        result = find_lime_questions(rows)
        assert len(result) == 0

    def test_ignores_lime_without_markers(self) -> None:
        """LIMEを含むが(ア)(イ)マーカーがない問題は検出しない"""
        rows = [
            (
                "uuid-3",
                "LIMEに関する記述として正しいものを選べ。",
                ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
                0,
                "LIMEの解説",
            ),
        ]
        result = find_lime_questions(rows)
        assert len(result) == 0

    def test_detects_lime_with_fullwidth_markers(self) -> None:
        """全角（ア）（イ）マーカーでも検出"""
        rows = [
            (
                "uuid-4",
                "LIMEの説明モデルに関して述べよ。",
                [
                    "（ア）線形回帰 （イ）決定境界",
                    "（ア）線形回帰 （イ）特徴量",
                ],
                0,
                "LIMEの解説",
            ),
        ]
        result = find_lime_questions(rows)
        assert len(result) == 1

    def test_ignores_lime_with_markers_already_in_content(self) -> None:
        """contentに既に(ア)(イ)が含まれている場合は検出しない"""
        rows = [
            (
                "uuid-5",
                "LIMEでは説明モデル g(z) = (ア) + Σ(イ)zᵢ の(ア)と(イ)に入る組合せを選べ。",
                [
                    "(ア)φ₀ (イ)φᵢ",
                    "(ア)w₀ (イ)wᵢ",
                ],
                0,
                "LIMEの解説",
            ),
        ]
        result = find_lime_questions(rows)
        assert len(result) == 0


class TestBuildLimePrompt:
    """LIME問題用プロンプト生成のテスト"""

    def test_includes_lime_context(self) -> None:
        """プロンプトにLIME固有の指示が含まれる"""
        prompt = build_lime_prompt(
            content="LIMEに関する問題文",
            choices=["(ア)X (イ)Y", "(ア)X (イ)Z"],
            correct_answer=0,
            explanation="LIMEの解説",
        )
        assert "LIME" in prompt
        assert "g(z)" in prompt or "説明モデル" in prompt

    def test_includes_choices(self) -> None:
        """プロンプトに選択肢が含まれる"""
        choices = ["(ア)φ₀ (イ)φᵢ", "(ア)w₀ (イ)wᵢ"]
        prompt = build_lime_prompt(
            content="LIMEの問題文",
            choices=choices,
            correct_answer=0,
            explanation="解説",
        )
        assert "(ア)φ₀ (イ)φᵢ" in prompt
        assert "(ア)w₀ (イ)wᵢ" in prompt

    def test_includes_explanation(self) -> None:
        """プロンプトに解説が含まれる"""
        prompt = build_lime_prompt(
            content="LIMEの問題文",
            choices=["(ア)X (イ)Y"],
            correct_answer=0,
            explanation="LIMEの詳しい解説テキスト",
        )
        assert "LIMEの詳しい解説テキスト" in prompt

    def test_includes_correct_answer_label(self) -> None:
        """正解ラベルが含まれる"""
        prompt = build_lime_prompt(
            content="LIMEの問題文",
            choices=["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
            correct_answer=2,
            explanation="解説",
        )
        assert "【正解】C" in prompt

    def test_includes_marker_instructions(self) -> None:
        """(ア)(イ)マーカーを含める指示がある"""
        prompt = build_lime_prompt(
            content="LIMEの問題文",
            choices=["(ア)X (イ)Y"],
            correct_answer=0,
            explanation="解説",
        )
        assert "(ア)" in prompt
        assert "(イ)" in prompt


class TestValidateLimeContent:
    """LIME問題のcontent検証テスト"""

    def test_valid_with_both_markers(self) -> None:
        """(ア)と(イ)の両方が含まれていればTrue"""
        result = validate_lime_content(
            "LIMEでは説明モデル g(z) = (ア) + Σ(イ)zᵢ の組合せを選べ。",
            ["(ア)φ₀ (イ)φᵢ", "(ア)w₀ (イ)wᵢ"],
        )
        assert result is True

    def test_valid_with_fullwidth_markers(self) -> None:
        """全角（ア）（イ）でもTrue"""
        result = validate_lime_content(
            "LIMEでは説明モデル g(z) = （ア） + Σ（イ）zᵢ の組合せを選べ。",
            ["(ア)φ₀ (イ)φᵢ"],
        )
        assert result is True

    def test_invalid_missing_ア(self) -> None:
        """(ア)が欠落 → False"""
        result = validate_lime_content(
            "LIMEの説明モデルでは(イ)が特徴量の重みである。",
            ["(ア)φ₀ (イ)φᵢ"],
        )
        assert result is False

    def test_invalid_missing_イ(self) -> None:
        """(イ)が欠落 → False"""
        result = validate_lime_content(
            "LIMEの説明モデルでは(ア)がバイアス項である。",
            ["(ア)φ₀ (イ)φᵢ"],
        )
        assert result is False

    def test_invalid_empty_content(self) -> None:
        """空文字 → False"""
        result = validate_lime_content(
            "",
            ["(ア)φ₀ (イ)φᵢ"],
        )
        assert result is False

    def test_must_contain_lime(self) -> None:
        """LIMEという単語が含まれていなければFalse"""
        result = validate_lime_content(
            "(ア)と(イ)の組合せを選べ。",
            ["(ア)φ₀ (イ)φᵢ"],
        )
        assert result is False
