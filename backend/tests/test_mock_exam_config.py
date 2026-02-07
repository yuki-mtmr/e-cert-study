"""模試設定テスト

Sprint 1: 模試設定値の正しさを検証
"""
from app.services.mock_exam_config import (
    PASSING_THRESHOLD,
    TIME_LIMIT_MINUTES,
    TOTAL_QUESTIONS,
    EXAM_AREAS,
    get_grade,
)


class TestMockExamConfig:
    """模試設定テスト"""

    def test_passing_threshold(self) -> None:
        assert PASSING_THRESHOLD == 65.0

    def test_time_limit(self) -> None:
        assert TIME_LIMIT_MINUTES == 120

    def test_total_questions(self) -> None:
        assert TOTAL_QUESTIONS == 100

    def test_exam_areas_total_100(self) -> None:
        """全エリアの問題数合計が100であること"""
        total = sum(area["question_count"] for area in EXAM_AREAS.values())
        assert total == 100

    def test_exam_areas_has_five(self) -> None:
        """5つの試験エリアが存在すること"""
        assert len(EXAM_AREAS) == 5

    def test_exam_area_names(self) -> None:
        """試験エリア名が正しいこと"""
        expected = {"応用数学", "機械学習", "深層学習の基礎", "深層学習の応用", "開発・運用環境"}
        assert set(EXAM_AREAS.keys()) == expected

    def test_exam_area_question_counts(self) -> None:
        """各エリアの問題数が正しいこと"""
        assert EXAM_AREAS["応用数学"]["question_count"] == 10
        assert EXAM_AREAS["機械学習"]["question_count"] == 25
        assert EXAM_AREAS["深層学習の基礎"]["question_count"] == 30
        assert EXAM_AREAS["深層学習の応用"]["question_count"] == 25
        assert EXAM_AREAS["開発・運用環境"]["question_count"] == 10


class TestGetGrade:
    """グレード判定テスト"""

    def test_grade_s(self) -> None:
        assert get_grade(95.0) == "S"

    def test_grade_a(self) -> None:
        assert get_grade(85.0) == "A"

    def test_grade_b(self) -> None:
        assert get_grade(72.0) == "B"

    def test_grade_c(self) -> None:
        assert get_grade(60.0) == "C"

    def test_grade_d(self) -> None:
        assert get_grade(45.0) == "D"

    def test_grade_f(self) -> None:
        assert get_grade(20.0) == "F"

    def test_grade_boundary_90(self) -> None:
        assert get_grade(90.0) == "S"

    def test_grade_boundary_80(self) -> None:
        assert get_grade(80.0) == "A"

    def test_grade_boundary_65(self) -> None:
        assert get_grade(65.0) == "B"

    def test_grade_boundary_50(self) -> None:
        assert get_grade(50.0) == "C"

    def test_grade_boundary_30(self) -> None:
        assert get_grade(30.0) == "D"

    def test_grade_zero(self) -> None:
        assert get_grade(0.0) == "F"

    def test_grade_100(self) -> None:
        assert get_grade(100.0) == "S"
