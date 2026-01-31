"""回答スキーマ"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AnswerCreate(BaseModel):
    """回答作成リクエスト"""

    question_id: uuid.UUID
    user_id: str = Field(..., min_length=1, max_length=255)
    selected_answer: int = Field(..., ge=0)


class AnswerResponse(BaseModel):
    """回答レスポンス"""

    id: uuid.UUID
    question_id: uuid.UUID
    user_id: str
    selected_answer: int
    is_correct: bool
    answered_at: datetime

    model_config = {"from_attributes": True}
