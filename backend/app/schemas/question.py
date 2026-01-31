"""問題スキーマ"""
import uuid
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class QuestionImageResponse(BaseModel):
    """問題画像レスポンス"""

    id: uuid.UUID
    question_id: uuid.UUID
    file_path: str
    alt_text: Optional[str] = None
    position: int
    image_type: Optional[str] = None

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    """問題作成リクエスト"""

    category_id: uuid.UUID
    content: str = Field(..., min_length=1)
    choices: list[str] = Field(..., min_length=2)
    correct_answer: int = Field(..., ge=0)
    explanation: str = Field(..., min_length=1)
    difficulty: int = Field(..., ge=1, le=5)
    source: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(default="plain", pattern=r"^(plain|markdown|code)$")

    @model_validator(mode="after")
    def validate_correct_answer(self) -> "QuestionCreate":
        """正解インデックスが選択肢の範囲内かチェック"""
        if self.correct_answer >= len(self.choices):
            raise ValueError("correct_answer must be within choices range")
        return self


class QuestionResponse(BaseModel):
    """問題レスポンス"""

    id: uuid.UUID
    category_id: uuid.UUID
    content: str
    choices: list[str]
    correct_answer: int
    explanation: str
    difficulty: int
    source: str
    content_type: str = "plain"
    images: list[QuestionImageResponse] = []

    model_config = {"from_attributes": True}


class QuestionUpdate(BaseModel):
    """問題更新リクエスト"""

    category_id: Optional[uuid.UUID] = None
    content: Optional[str] = Field(None, min_length=1)
    choices: Optional[list[str]] = Field(None, min_length=2)
    correct_answer: Optional[int] = Field(None, ge=0)
    explanation: Optional[str] = Field(None, min_length=1)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    source: Optional[str] = Field(None, min_length=1, max_length=255)
    content_type: Optional[str] = Field(None, pattern=r"^(plain|markdown|code)$")
