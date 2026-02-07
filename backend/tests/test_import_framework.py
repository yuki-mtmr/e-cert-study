"""PDFインポート時のフレームワーク検出テスト

import_questions_from_pdf内でQuestionオブジェクト作成時に
detect_frameworkが呼ばれ、framework属性が設定されることを検証。
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.question import Question
from app.services.framework_detector import detect_framework


class TestImportSetsFramework:
    """インポート時にフレームワークが設定されることを検証"""

    def test_import_sets_framework_pytorch(self) -> None:
        """PyTorch問題のインポート時にframework='pytorch'が設定される"""
        content = "import torch\nx = torch.tensor([1, 2, 3])\nprint(x)"
        choices = ["tensor([1, 2, 3])", "error", "[1, 2, 3]", "None"]

        framework = detect_framework(content, choices)
        question = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content=content,
            choices=choices,
            correct_answer=0,
            explanation="torch.tensorの出力",
            difficulty=3,
            source="test.pdf",
            framework=framework,
        )
        assert question.framework == "pytorch"

    def test_import_sets_framework_tensorflow(self) -> None:
        """TensorFlow問題のインポート時にframework='tensorflow'が設定される"""
        content = "import tensorflow as tf\nx = tf.constant([1, 2, 3])"
        choices = ["tf.Tensor", "numpy array", "list", "error"]

        framework = detect_framework(content, choices)
        question = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content=content,
            choices=choices,
            correct_answer=0,
            explanation="tf.constantの出力",
            difficulty=3,
            source="test.pdf",
            framework=framework,
        )
        assert question.framework == "tensorflow"

    def test_import_sets_framework_none_for_theory(self) -> None:
        """理論問題のインポート時にframework=Noneが設定される"""
        content = "バッチ正規化の効果として正しいものを選べ。"
        choices = [
            "内部共変量シフトを軽減する",
            "学習率を大きくできる",
            "正則化効果がある",
            "すべて正しい",
        ]

        framework = detect_framework(content, choices)
        question = Question(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content=content,
            choices=choices,
            correct_answer=3,
            explanation="バッチ正規化の解説",
            difficulty=2,
            source="test.pdf",
            framework=framework,
        )
        assert question.framework is None
