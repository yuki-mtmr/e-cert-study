"""選択肢の重複バリデーションテスト

parse_llm_response()が重複選択肢を含む問題を正しく処理するかをテスト。
"""
import json

import pytest

from app.services.pdf_extractor import parse_llm_response


def _make_question(
    choices: list[str],
    correct_answer: int = 0,
) -> dict:
    """テスト用の問題辞書を作成"""
    return {
        "content": "テスト問題",
        "choices": choices,
        "correct_answer": correct_answer,
        "explanation": "テスト解説",
        "difficulty": 3,
    }


class TestChoiceDedup:
    """選択肢重複バリデーション"""

    def test_unique_choices_pass(self):
        """重複なしの選択肢はそのまま通る"""
        q = _make_question(["A", "B", "C", "D"])
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["choices"] == ["A", "B", "C", "D"]

    def test_duplicate_choices_skipped(self):
        """完全一致する重複選択肢がある問題はスキップされる"""
        q = _make_question(["A", "A", "B", "C"])
        response = json.dumps([q])
        result = parse_llm_response(response)
        # 重複除去後にユニーク選択肢が3個→2個以上なのでスキップはしない
        # ただし重複は除去される
        # 仕様変更: 重複除去後2個未満ならスキップ
        assert len(result) == 1
        unique_choices = list(dict.fromkeys(result[0]["choices"]))
        assert len(unique_choices) == len(result[0]["choices"])

    def test_whitespace_trimmed_duplicate_skipped(self):
        """空白トリム後に重複する選択肢は重複とみなす"""
        q = _make_question(["A ", " A", "B", "C"])
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 1
        # トリム後の重複が除去されている
        for choice in result[0]["choices"]:
            assert choice == choice.strip()

    def test_all_same_choices_skipped(self):
        """全選択肢が同一の問題はスキップされる（除去後1個未満）"""
        q = _make_question(["A", "A", "A", "A"])
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 0

    def test_correct_answer_out_of_range_skipped(self):
        """correct_answerが選択肢数を超える場合はスキップ"""
        q = _make_question(["A", "B", "C", "D"], correct_answer=5)
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 0

    def test_correct_answer_negative_skipped(self):
        """correct_answerが負の値の場合はスキップ"""
        q = _make_question(["A", "B", "C", "D"], correct_answer=-1)
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 0

    def test_correct_answer_adjusted_after_dedup(self):
        """重複除去後にcorrect_answerが範囲外になったらスキップ"""
        # correct_answer=3 だが重複除去後は3個しかないのでindex 3は範囲外
        q = _make_question(["A", "A", "B", "C"], correct_answer=3)
        response = json.dumps([q])
        result = parse_llm_response(response)
        assert len(result) == 0

    def test_mixed_valid_and_invalid(self):
        """有効な問題と無効な問題が混在する場合、有効なもののみ返す"""
        valid_q = _make_question(["A", "B", "C", "D"], correct_answer=0)
        invalid_q = _make_question(["A", "A", "A", "A"], correct_answer=0)
        oor_q = _make_question(["A", "B", "C", "D"], correct_answer=10)
        response = json.dumps([valid_q, invalid_q, oor_q])
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["choices"] == ["A", "B", "C", "D"]
