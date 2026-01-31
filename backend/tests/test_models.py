"""データベースモデルのテスト"""
import uuid
from datetime import datetime

import pytest

from app.models.category import Category
from app.models.question import Question
from app.models.answer import Answer
from app.models.question_image import QuestionImage


class TestCategoryModel:
    """カテゴリモデルのテスト"""

    def test_category_has_required_fields(self) -> None:
        """カテゴリモデルに必須フィールドがあることを確認"""
        category = Category(
            id=uuid.uuid4(),
            name="深層学習",
        )
        assert category.id is not None
        assert category.name == "深層学習"
        assert category.parent_id is None

    def test_category_with_parent(self) -> None:
        """親カテゴリを持つカテゴリを作成できることを確認"""
        parent_id = uuid.uuid4()
        category = Category(
            id=uuid.uuid4(),
            name="CNN",
            parent_id=parent_id,
        )
        assert category.parent_id == parent_id


class TestQuestionModel:
    """問題モデルのテスト"""

    def test_question_has_required_fields(self) -> None:
        """問題モデルに必須フィールドがあることを確認"""
        category_id = uuid.uuid4()
        question = Question(
            id=uuid.uuid4(),
            category_id=category_id,
            content="バックプロパゲーションの目的は何か？",
            choices=["重みの初期化", "損失の最小化", "勾配の計算", "データの正規化"],
            correct_answer=2,
            explanation="バックプロパゲーションは誤差を逆伝播させ、各重みの勾配を計算するアルゴリズムです。",
            difficulty=3,
            source="E資格対策問題集",
        )
        assert question.id is not None
        assert question.category_id == category_id
        assert question.content == "バックプロパゲーションの目的は何か？"
        assert len(question.choices) == 4
        assert question.correct_answer == 2
        assert question.difficulty == 3
        assert question.source == "E資格対策問題集"

    def test_question_choices_is_list(self) -> None:
        """選択肢がリストであることを確認"""
        question = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=1,
            source="テスト",
        )
        assert isinstance(question.choices, list)


class TestAnswerModel:
    """回答履歴モデルのテスト"""

    def test_answer_has_required_fields(self) -> None:
        """回答履歴モデルに必須フィールドがあることを確認"""
        question_id = uuid.uuid4()
        answer = Answer(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id="local_user_123",
            selected_answer=1,
            is_correct=False,
            answered_at=datetime.now(),
        )
        assert answer.id is not None
        assert answer.question_id == question_id
        assert answer.user_id == "local_user_123"
        assert answer.selected_answer == 1
        assert answer.is_correct is False
        assert answer.answered_at is not None


class TestQuestionImageModel:
    """問題画像モデルのテスト"""

    def test_question_image_has_required_fields(self) -> None:
        """問題画像モデルに必須フィールドがあることを確認"""
        question_id = uuid.uuid4()
        image = QuestionImage(
            id=uuid.uuid4(),
            question_id=question_id,
            file_path="/static/images/test.png",
            position=0,
        )
        assert image.id is not None
        assert image.question_id == question_id
        assert image.file_path == "/static/images/test.png"
        assert image.position == 0
        assert image.alt_text is None
        assert image.image_type is None

    def test_question_image_with_optional_fields(self) -> None:
        """オプションフィールド付きの画像モデルを作成できることを確認"""
        image = QuestionImage(
            id=uuid.uuid4(),
            question_id=uuid.uuid4(),
            file_path="/static/images/diagram.png",
            position=1,
            alt_text="Neural network architecture diagram",
            image_type="diagram",
        )
        assert image.alt_text == "Neural network architecture diagram"
        assert image.image_type == "diagram"

    def test_question_image_types(self) -> None:
        """画像タイプが正しく設定できることを確認"""
        valid_types = ["diagram", "formula", "graph"]
        for img_type in valid_types:
            image = QuestionImage(
                id=uuid.uuid4(),
                question_id=uuid.uuid4(),
                file_path=f"/static/images/{img_type}.png",
                position=0,
                image_type=img_type,
            )
            assert image.image_type == img_type
