"""問題品質修正スクリプトのテスト"""
import re

import pytest

from scripts.fix_question_quality import TEXT_FIX_PATTERNS


class TestTextFixPatterns:
    """テキスト破損修正パターンのテスト"""

    def test_fix_incomplete_kanji(self) -> None:
        """「を了した」→「を完了した」の修正"""
        text = "事前学習を了した"
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == "事前学習を完了した"

    def test_fix_missing_tsu(self) -> None:
        """「にいて」→「について」の修正"""
        text = "機械学習にいて述べよ"
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == "機械学習について述べよ"

    def test_fix_missing_so(self) -> None:
        """「れぞれ」→「それぞれ」の修正"""
        text = "れぞれの値を求めよ"
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == "それぞれの値を求めよ"

    def test_no_false_positive_on_clean_text(self) -> None:
        """正常なテキストは変更されないこと"""
        text = "深層学習の基礎について、次の問いに答えよ。"
        original = text
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == original

    def test_no_false_positive_sorezore(self) -> None:
        """「それぞれ」が「そそれぞれ」にならないこと"""
        text = "距離の計算方法について、それぞれの特徴として最も適切なものを一つ選べ。"
        original = text
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == original

    def test_no_false_positive_kanryou(self) -> None:
        """「を完了した」が「を完完了した」にならないこと"""
        text = "事前学習を完了したBERTに対して"
        original = text
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == original

    def test_no_false_positive_tsuite(self) -> None:
        """「について」が「についついて」にならないこと"""
        text = "機械学習について述べよ"
        original = text
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == original

    def test_multiple_fixes_in_one_text(self) -> None:
        """1つのテキストに複数の破損がある場合"""
        text = "学習を了した後、れぞれの結果にいて比較する"
        for pattern, replacement in TEXT_FIX_PATTERNS:
            text = re.sub(pattern, replacement, text)
        assert text == "学習を完了した後、それぞれの結果について比較する"
