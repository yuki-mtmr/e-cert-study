"""模試スキーマテスト

Sprint 1: Pydanticスキーマのバリデーションを検証
"""
import uuid
from datetime import datetime

import pytest

from app.schemas.mock_exam import (
    MockExamStartRequest,
    MockExamStartResponse,
    MockExamQuestionResponse,
    MockExamAnswerRequest,
    MockExamAnswerResponse,
    MockExamFinishRequest,
    CategoryScoreDetail,
    MockExamResultResponse,
    MockExamHistoryItem,
    MockExamHistoryResponse,
    AIAnalysisResponse,
)


class TestMockExamStartRequest:
    def test_valid(self) -> None:
        req = MockExamStartRequest(user_id="test-user")
        assert req.user_id == "test-user"

    def test_user_id_required(self) -> None:
        with pytest.raises(Exception):
            MockExamStartRequest()


class TestMockExamStartResponse:
    def test_valid(self) -> None:
        resp = MockExamStartResponse(
            exam_id=uuid.uuid4(),
            total_questions=100,
            time_limit_minutes=120,
            questions=[],
            started_at=datetime.utcnow(),
        )
        assert resp.total_questions == 100
        assert resp.time_limit_minutes == 120


class TestMockExamQuestionResponse:
    def test_valid(self) -> None:
        q = MockExamQuestionResponse(
            question_index=0,
            question_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            content_type="plain",
            exam_area="応用数学",
            images=[],
        )
        assert q.question_index == 0
        assert q.exam_area == "応用数学"


class TestMockExamAnswerRequest:
    def test_valid(self) -> None:
        req = MockExamAnswerRequest(question_index=5, selected_answer=2)
        assert req.question_index == 5
        assert req.selected_answer == 2


class TestMockExamAnswerResponse:
    def test_valid(self) -> None:
        resp = MockExamAnswerResponse(question_index=5, is_correct=True)
        assert resp.is_correct is True


class TestMockExamFinishRequest:
    def test_valid(self) -> None:
        req = MockExamFinishRequest(user_id="test-user")
        assert req.user_id == "test-user"


class TestCategoryScoreDetail:
    def test_valid(self) -> None:
        detail = CategoryScoreDetail(
            area_name="応用数学",
            total=10,
            correct=7,
            accuracy=70.0,
            grade="B",
        )
        assert detail.grade == "B"


class TestMockExamResultResponse:
    def test_valid(self) -> None:
        resp = MockExamResultResponse(
            exam_id=uuid.uuid4(),
            user_id="test-user",
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            total_questions=100,
            correct_count=72,
            score=72.0,
            passed=True,
            passing_threshold=65.0,
            category_scores=[],
            analysis="",
            ai_analysis=None,
            status="finished",
        )
        assert resp.passed is True
        assert resp.passing_threshold == 65.0


class TestMockExamHistoryItem:
    def test_valid(self) -> None:
        item = MockExamHistoryItem(
            exam_id=uuid.uuid4(),
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            score=72.0,
            passed=True,
            status="finished",
        )
        assert item.passed is True


class TestMockExamHistoryResponse:
    def test_valid(self) -> None:
        resp = MockExamHistoryResponse(exams=[], total_count=0)
        assert resp.total_count == 0


class TestAIAnalysisResponse:
    def test_valid(self) -> None:
        resp = AIAnalysisResponse(
            exam_id=uuid.uuid4(),
            ai_analysis="AI分析結果",
        )
        assert resp.ai_analysis == "AI分析結果"
