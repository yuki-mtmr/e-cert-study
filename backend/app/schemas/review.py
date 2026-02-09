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


class ReviewItemDetailResponse(ReviewItemResponse):
    """復習アイテム詳細レスポンス（問題内容・カテゴリ名付き）"""

    question_content: str
    question_category_name: Optional[str] = None


class BackfillRequest(BaseModel):
    """バックフィルリクエスト"""

    user_id: str


class BackfillResponse(BaseModel):
    """バックフィルレスポンス"""

    exams_processed: int
    items_created: int
