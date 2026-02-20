"""問題APIエンドポイント用のスキーマ"""
import uuid
from typing import Any

from pydantic import BaseModel


class ImportResponse(BaseModel):
    """PDFインポートレスポンス"""
    questions: list[dict[str, Any]]
    count: int
    saved_count: int = 0
    extracted_images: int = 0
    image_filenames: list[str] = []
    questions_with_refs: int = 0
    sample_refs: list[str] = []


class CategoryUpdateRequest(BaseModel):
    """カテゴリ更新リクエスト"""
    category_id: uuid.UUID


class CategoryUpdateResponse(BaseModel):
    """カテゴリ更新レスポンス"""
    id: uuid.UUID
    category_id: uuid.UUID
    message: str


class AutoClassifyResponse(BaseModel):
    """自動分類レスポンス"""
    total: int
    classified: int
    failed: int
    results: list[dict[str, Any]] = []


class RegenerateExplanationResponse(BaseModel):
    """個別解説再生成レスポンス"""
    question_id: str
    explanation: str
    status: str


class RegenerateExplanationsResponse(BaseModel):
    """一括解説再生成レスポンス"""
    total: int
    regenerated: int
    failed: int
    skipped: int = 0
    results: list[dict[str, Any]] = []
