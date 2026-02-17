"""模試スキーマ"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MockExamStartRequest(BaseModel):
    user_id: str


class MockExamQuestionResponse(BaseModel):
    question_index: int
    question_id: uuid.UUID
    content: str
    choices: list[str]
    content_type: str
    exam_area: str
    topic: Optional[str] = None
    images: list[dict] = []


class MockExamStartResponse(BaseModel):
    exam_id: uuid.UUID
    total_questions: int
    time_limit_minutes: int = 120
    questions: list[MockExamQuestionResponse]
    started_at: datetime


class MockExamAnswerRequest(BaseModel):
    question_index: int
    selected_answer: int


class MockExamAnswerResponse(BaseModel):
    question_index: int
    is_correct: bool


class MockExamFinishRequest(BaseModel):
    user_id: str


class CategoryScoreDetail(BaseModel):
    area_name: str
    total: int
    correct: int
    accuracy: float
    grade: str


class MockExamResultResponse(BaseModel):
    exam_id: uuid.UUID
    user_id: str
    started_at: datetime
    finished_at: Optional[datetime]
    total_questions: int
    correct_count: int
    score: float
    passed: Optional[bool]
    passing_threshold: float = 65.0
    category_scores: list[CategoryScoreDetail]
    analysis: str
    ai_analysis: Optional[str]
    status: str


class MockExamHistoryItem(BaseModel):
    exam_id: uuid.UUID
    started_at: datetime
    finished_at: Optional[datetime]
    score: float
    passed: Optional[bool]
    status: str


class MockExamHistoryResponse(BaseModel):
    exams: list[MockExamHistoryItem]
    total_count: int


class AIAnalysisResponse(BaseModel):
    exam_id: uuid.UUID
    ai_analysis: str
