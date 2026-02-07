"""模試モデルテスト

Sprint 1: MockExam / MockExamAnswer モデルのフィールド・デフォルト値を検証
"""
import uuid
from datetime import datetime

from app.models.mock_exam import MockExam, MockExamAnswer


class TestMockExamModel:
    """MockExamモデルテスト"""

    def test_tablename(self) -> None:
        assert MockExam.__tablename__ == "mock_exams"

    def test_has_required_columns(self) -> None:
        """必要なカラムが存在すること"""
        columns = {c.name for c in MockExam.__table__.columns}
        expected = {
            "id", "user_id", "started_at", "finished_at",
            "total_questions", "correct_count", "score",
            "passed", "category_scores", "ai_analysis", "status",
        }
        assert expected.issubset(columns)

    def test_default_values(self) -> None:
        """デフォルト値が正しいこと"""
        col_map = {c.name: c for c in MockExam.__table__.columns}
        assert col_map["total_questions"].default.arg == 100
        assert col_map["correct_count"].default.arg == 0
        assert col_map["score"].default.arg == 0.0
        assert col_map["status"].default.arg == "in_progress"

    def test_nullable_fields(self) -> None:
        """nullable フィールドが正しいこと"""
        col_map = {c.name: c for c in MockExam.__table__.columns}
        assert col_map["finished_at"].nullable is True
        assert col_map["passed"].nullable is True
        assert col_map["category_scores"].nullable is True
        assert col_map["ai_analysis"].nullable is True


class TestMockExamAnswerModel:
    """MockExamAnswerモデルテスト"""

    def test_tablename(self) -> None:
        assert MockExamAnswer.__tablename__ == "mock_exam_answers"

    def test_has_required_columns(self) -> None:
        """必要なカラムが存在すること"""
        columns = {c.name for c in MockExamAnswer.__table__.columns}
        expected = {
            "id", "mock_exam_id", "question_id", "question_index",
            "selected_answer", "is_correct", "answered_at",
            "category_name", "exam_area",
        }
        assert expected.issubset(columns)

    def test_nullable_fields(self) -> None:
        """回答前はnullableであること"""
        col_map = {c.name: c for c in MockExamAnswer.__table__.columns}
        assert col_map["selected_answer"].nullable is True
        assert col_map["is_correct"].nullable is True
        assert col_map["answered_at"].nullable is True
