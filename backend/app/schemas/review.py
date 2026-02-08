"""復習スキーマ"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReviewItemResponse(BaseModel):
    """復習アイテムレスポンス"""

    id: uuid.UUID
    question_id: uuid.UUID
    user_id: str
    correct_count: int
    status: str
    first_wrong_at: datetime
    last_answered_at: datetime
    mastered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReviewStatsResponse(BaseModel):
    """復習統計レスポンス"""

    active_count: int
    mastered_count: int
    total_count: int
