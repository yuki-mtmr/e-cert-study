"""Pydanticスキーマのテスト"""
import uuid
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.question import QuestionCreate, QuestionResponse, QuestionImageResponse
from app.schemas.answer import AnswerCreate, AnswerResponse


class TestCategorySchemas:
    """カテゴリスキーマのテスト"""

    def test_category_create_valid(self) -> None:
        """正常なカテゴリ作成スキーマ"""
        schema = CategoryCreate(name="深層学習")
        assert schema.name == "深層学習"
        assert schema.parent_id is None

    def test_category_create_with_parent(self) -> None:
        """親カテゴリを持つカテゴリ作成"""
        parent_id = uuid.uuid4()
        schema = CategoryCreate(name="CNN", parent_id=parent_id)
        assert schema.parent_id == parent_id

    def test_category_create_empty_name_fails(self) -> None:
        """空の名前は失敗する"""
        with pytest.raises(ValidationError):
            CategoryCreate(name="")

    def test_category_response(self) -> None:
        """カテゴリレスポンススキーマ"""
        cat_id = uuid.uuid4()
        schema = CategoryResponse(id=cat_id, name="深層学習", parent_id=None)
        assert schema.id == cat_id
        assert schema.name == "深層学習"


class TestQuestionSchemas:
    """問題スキーマのテスト"""

    def test_question_create_valid(self) -> None:
        """正常な問題作成スキーマ"""
        schema = QuestionCreate(
            category_id=uuid.uuid4(),
            content="問題文",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="テスト",
        )
        assert schema.content == "問題文"
        assert len(schema.choices) == 4
        assert schema.correct_answer == 0

    def test_question_choices_minimum(self) -> None:
        """選択肢が2つ以上必要"""
        with pytest.raises(ValidationError):
            QuestionCreate(
                category_id=uuid.uuid4(),
                content="問題",
                choices=["A"],
                correct_answer=0,
                explanation="解説",
                difficulty=1,
                source="テスト",
            )

    def test_question_difficulty_range(self) -> None:
        """難易度は1-5の範囲"""
        with pytest.raises(ValidationError):
            QuestionCreate(
                category_id=uuid.uuid4(),
                content="問題",
                choices=["A", "B"],
                correct_answer=0,
                explanation="解説",
                difficulty=6,
                source="テスト",
            )

    def test_question_correct_answer_within_choices(self) -> None:
        """正解インデックスは選択肢の範囲内"""
        with pytest.raises(ValidationError):
            QuestionCreate(
                category_id=uuid.uuid4(),
                content="問題",
                choices=["A", "B"],
                correct_answer=5,
                explanation="解説",
                difficulty=1,
                source="テスト",
            )

    def test_question_response(self) -> None:
        """問題レスポンススキーマ"""
        q_id = uuid.uuid4()
        cat_id = uuid.uuid4()
        schema = QuestionResponse(
            id=q_id,
            category_id=cat_id,
            content="問題文",
            choices=["A", "B", "C", "D"],
            correct_answer=1,
            explanation="解説",
            difficulty=2,
            source="テスト",
        )
        assert schema.id == q_id
        assert schema.content_type == "plain"
        assert schema.images == []

    def test_question_response_with_content_type(self) -> None:
        """content_type付き問題レスポンススキーマ"""
        schema = QuestionResponse(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="# Markdown問題文",
            choices=["A", "B", "C", "D"],
            correct_answer=1,
            explanation="解説",
            difficulty=2,
            source="テスト",
            content_type="markdown",
        )
        assert schema.content_type == "markdown"

    def test_question_response_with_images(self) -> None:
        """画像付き問題レスポンススキーマ"""
        q_id = uuid.uuid4()
        img_id = uuid.uuid4()
        schema = QuestionResponse(
            id=q_id,
            category_id=uuid.uuid4(),
            content="問題文",
            choices=["A", "B", "C", "D"],
            correct_answer=1,
            explanation="解説",
            difficulty=2,
            source="テスト",
            images=[
                QuestionImageResponse(
                    id=img_id,
                    question_id=q_id,
                    file_path="/static/images/test.png",
                    position=0,
                    alt_text="テスト画像",
                    image_type="diagram",
                )
            ],
        )
        assert len(schema.images) == 1
        assert schema.images[0].file_path == "/static/images/test.png"

    def test_question_create_with_content_type(self) -> None:
        """content_type付き問題作成スキーマ"""
        schema = QuestionCreate(
            category_id=uuid.uuid4(),
            content="```python\nprint('hello')\n```",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="テスト",
            content_type="code",
        )
        assert schema.content_type == "code"

    def test_question_create_invalid_content_type(self) -> None:
        """不正なcontent_typeは失敗する"""
        with pytest.raises(ValidationError):
            QuestionCreate(
                category_id=uuid.uuid4(),
                content="問題",
                choices=["A", "B"],
                correct_answer=0,
                explanation="解説",
                difficulty=1,
                source="テスト",
                content_type="invalid",
            )


class TestAnswerSchemas:
    """回答スキーマのテスト"""

    def test_answer_create_valid(self) -> None:
        """正常な回答作成スキーマ"""
        schema = AnswerCreate(
            question_id=uuid.uuid4(),
            user_id="local_user_123",
            selected_answer=2,
        )
        assert schema.selected_answer == 2

    def test_answer_response(self) -> None:
        """回答レスポンススキーマ"""
        a_id = uuid.uuid4()
        q_id = uuid.uuid4()
        now = datetime.now()
        schema = AnswerResponse(
            id=a_id,
            question_id=q_id,
            user_id="user",
            selected_answer=1,
            is_correct=True,
            answered_at=now,
        )
        assert schema.is_correct is True
        assert schema.answered_at == now
