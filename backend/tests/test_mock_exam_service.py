"""模試サービステスト

Sprint 2: 問題選択・スコア計算・ルールベース分析を検証
"""
import uuid

import pytest

from app.services.mock_exam_service import (
    calculate_scores,
    generate_rule_based_analysis,
)
from app.services.mock_exam_config import get_grade


class TestCalculateScores:
    """スコア計算テスト"""

    def test_perfect_score(self) -> None:
        """満点の場合"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"} for _ in range(10)
        ] + [
            {"is_correct": True, "exam_area": "機械学習"} for _ in range(25)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の基礎"} for _ in range(30)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の応用"} for _ in range(25)
        ] + [
            {"is_correct": True, "exam_area": "開発・運用環境"} for _ in range(10)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 100
        assert result["score"] == 100.0
        assert result["passed"] is True

    def test_zero_score(self) -> None:
        """0点の場合"""
        answers = [
            {"is_correct": False, "exam_area": "応用数学"} for _ in range(10)
        ] + [
            {"is_correct": False, "exam_area": "機械学習"} for _ in range(25)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の基礎"} for _ in range(30)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の応用"} for _ in range(25)
        ] + [
            {"is_correct": False, "exam_area": "開発・運用環境"} for _ in range(10)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 0
        assert result["score"] == 0.0
        assert result["passed"] is False

    def test_passing_boundary(self) -> None:
        """合格ラインギリギリ（65%）"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"} for _ in range(7)
        ] + [
            {"is_correct": False, "exam_area": "応用数学"} for _ in range(3)
        ] + [
            {"is_correct": True, "exam_area": "機械学習"} for _ in range(16)
        ] + [
            {"is_correct": False, "exam_area": "機械学習"} for _ in range(9)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の基礎"} for _ in range(20)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の基礎"} for _ in range(10)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の応用"} for _ in range(16)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の応用"} for _ in range(9)
        ] + [
            {"is_correct": True, "exam_area": "開発・運用環境"} for _ in range(6)
        ] + [
            {"is_correct": False, "exam_area": "開発・運用環境"} for _ in range(4)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 65
        assert result["score"] == 65.0
        assert result["passed"] is True

    def test_category_scores_structure(self) -> None:
        """カテゴリ別スコアの構造が正しいこと"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"},
            {"is_correct": False, "exam_area": "応用数学"},
            {"is_correct": True, "exam_area": "機械学習"},
        ]
        result = calculate_scores(answers)
        scores = result["category_scores"]
        # 辞書型のスコアが返ること
        assert "応用数学" in scores
        assert scores["応用数学"]["total"] == 2
        assert scores["応用数学"]["correct"] == 1
        assert scores["応用数学"]["accuracy"] == 50.0
        assert scores["応用数学"]["grade"] == get_grade(50.0)

    def test_unanswered_questions(self) -> None:
        """未回答（is_correct=None）は不正解扱い"""
        answers = [
            {"is_correct": None, "exam_area": "応用数学"},
            {"is_correct": True, "exam_area": "応用数学"},
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 1
        assert result["score"] == 50.0

    def test_empty_answers(self) -> None:
        """回答なしの場合"""
        result = calculate_scores([])
        assert result["correct_count"] == 0
        assert result["score"] == 0.0
        assert result["passed"] is False


class TestGenerateRuleBasedAnalysis:
    """ルールベース辛口分析テスト"""

    def test_passing_high_score(self) -> None:
        """高得点合格の分析"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 9, "accuracy": 90.0, "grade": "S"},
            "機械学習": {"total": 25, "correct": 22, "accuracy": 88.0, "grade": "A"},
            "深層学習の基礎": {"total": 30, "correct": 28, "accuracy": 93.3, "grade": "S"},
            "深層学習の応用": {"total": 25, "correct": 20, "accuracy": 80.0, "grade": "A"},
            "開発・運用環境": {"total": 10, "correct": 8, "accuracy": 80.0, "grade": "A"},
        }
        result = generate_rule_based_analysis(
            score=87.0, correct_count=87, total=100,
            passed=True, category_scores=category_scores
        )
        assert isinstance(result, str)
        assert len(result) > 0
        # 合格であることが明示されていること
        assert "合格" in result

    def test_failing_low_score(self) -> None:
        """低得点不合格の分析"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 3, "accuracy": 30.0, "grade": "D"},
            "機械学習": {"total": 25, "correct": 10, "accuracy": 40.0, "grade": "D"},
            "深層学習の基礎": {"total": 30, "correct": 12, "accuracy": 40.0, "grade": "D"},
            "深層学習の応用": {"total": 25, "correct": 8, "accuracy": 32.0, "grade": "D"},
            "開発・運用環境": {"total": 10, "correct": 2, "accuracy": 20.0, "grade": "F"},
        }
        result = generate_rule_based_analysis(
            score=35.0, correct_count=35, total=100,
            passed=False, category_scores=category_scores
        )
        assert isinstance(result, str)
        assert "不合格" in result

    def test_failing_mentions_remaining(self) -> None:
        """不合格時、合格まであとN問の情報が含まれること"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 6, "accuracy": 60.0, "grade": "C"},
        }
        result = generate_rule_based_analysis(
            score=60.0, correct_count=60, total=100,
            passed=False, category_scores=category_scores
        )
        # 合格まであと5問という情報が含まれること
        assert "5" in result

    def test_analysis_includes_weak_area(self) -> None:
        """弱点分野が指摘されること"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 9, "accuracy": 90.0, "grade": "S"},
            "機械学習": {"total": 25, "correct": 5, "accuracy": 20.0, "grade": "F"},
        }
        result = generate_rule_based_analysis(
            score=70.0, correct_count=14, total=35,
            passed=True, category_scores=category_scores
        )
        # 弱点分野が含まれること
        assert "機械学習" in result
