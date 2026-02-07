"""フレームワークタグ付けモデルテスト"""
import uuid

from app.models.question import Question


class TestQuestionFrameworkField:
    """Questionモデルのframeworkフィールドテスト"""

    def test_question_model_has_framework_field(self) -> None:
        """Questionモデルにframeworkカラムが存在する"""
        q = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="test",
            framework="pytorch",
        )
        assert q.framework == "pytorch"

    def test_question_framework_default_none(self) -> None:
        """frameworkのデフォルト値はNone"""
        q = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="test",
        )
        assert q.framework is None

    def test_question_framework_tensorflow(self) -> None:
        """frameworkにtensorflowを設定可能"""
        q = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="test",
            framework="tensorflow",
        )
        assert q.framework == "tensorflow"
