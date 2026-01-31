"""カテゴリスキーマ"""
import uuid
from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """カテゴリ作成リクエスト"""

    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[uuid.UUID] = None


class CategoryResponse(BaseModel):
    """カテゴリレスポンス"""

    id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


class CategoryUpdate(BaseModel):
    """カテゴリ更新リクエスト"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[uuid.UUID] = None
