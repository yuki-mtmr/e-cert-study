"""チャットスキーマ"""
from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """チャットメッセージ"""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    """チャットリクエスト"""

    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = []
