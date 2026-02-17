"""修正スクリプトのピュア関数テスト

DB操作ロジックのテストではなく、修正データ生成ロジックをテストする。
"""
import pytest

from scripts.fix_reported_questions import (
    build_remove_images_fix,
    build_fix_choices_fix,
    build_fix_content_fix,
    build_fix_correct_answer_fix,
    apply_fix_preview,
)


class TestBuildRemoveImagesFix:
    """不要画像削除の修正データ生成"""

    def test_creates_fix_data(self):
        image_ids = ["img-1", "img-2"]
        result = build_remove_images_fix("q-1", image_ids)
        assert result["question_id"] == "q-1"
        assert result["action"] == "remove_images"
        assert result["image_ids"] == ["img-1", "img-2"]

    def test_empty_image_ids(self):
        result = build_remove_images_fix("q-1", [])
        assert result is None


class TestBuildFixChoicesFix:
    """選択肢修正の修正データ生成"""

    def test_creates_fix_data(self):
        result = build_fix_choices_fix(
            "q-1",
            old_choices=["MAE", "MAE", "RMSE", "MSE"],
            new_choices=["MAE", "MAPE", "RMSE", "MSE"],
        )
        assert result["question_id"] == "q-1"
        assert result["action"] == "fix_choices"
        assert result["old_choices"] == ["MAE", "MAE", "RMSE", "MSE"]
        assert result["new_choices"] == ["MAE", "MAPE", "RMSE", "MSE"]

    def test_no_change(self):
        result = build_fix_choices_fix(
            "q-1",
            old_choices=["A", "B", "C", "D"],
            new_choices=["A", "B", "C", "D"],
        )
        assert result is None


class TestBuildFixContentFix:
    """content修正の修正データ生成"""

    def test_creates_fix_data(self):
        result = build_fix_content_fix(
            "q-1",
            old_content="短い問題文",
            new_content="(あ)はXで(い)はYである。正しい組合せを選べ。",
        )
        assert result["question_id"] == "q-1"
        assert result["action"] == "fix_content"
        assert result["old_content"] == "短い問題文"
        assert "正しい組合せ" in result["new_content"]

    def test_no_change(self):
        result = build_fix_content_fix("q-1", "同じ", "同じ")
        assert result is None


class TestBuildFixCorrectAnswerFix:
    """correct_answer修正の修正データ生成"""

    def test_creates_fix_data(self):
        result = build_fix_correct_answer_fix("q-1", old_answer=0, new_answer=2)
        assert result["question_id"] == "q-1"
        assert result["action"] == "fix_correct_answer"
        assert result["old_answer"] == 0
        assert result["new_answer"] == 2

    def test_no_change(self):
        result = build_fix_correct_answer_fix("q-1", old_answer=1, new_answer=1)
        assert result is None


class TestApplyFixPreview:
    """修正プレビュー出力"""

    def test_remove_images_preview(self):
        fix = {
            "question_id": "q-1",
            "action": "remove_images",
            "image_ids": ["img-1"],
        }
        lines = apply_fix_preview(fix)
        assert any("remove_images" in line for line in lines)
        assert any("img-1" in line for line in lines)

    def test_fix_choices_preview(self):
        fix = {
            "question_id": "q-1",
            "action": "fix_choices",
            "old_choices": ["A", "A", "C", "D"],
            "new_choices": ["A", "B", "C", "D"],
        }
        lines = apply_fix_preview(fix)
        assert any("fix_choices" in line for line in lines)

    def test_fix_content_preview(self):
        fix = {
            "question_id": "q-1",
            "action": "fix_content",
            "old_content": "old",
            "new_content": "new",
        }
        lines = apply_fix_preview(fix)
        assert any("fix_content" in line for line in lines)

    def test_fix_correct_answer_preview(self):
        fix = {
            "question_id": "q-1",
            "action": "fix_correct_answer",
            "old_answer": 0,
            "new_answer": 2,
        }
        lines = apply_fix_preview(fix)
        assert any("fix_correct_answer" in line for line in lines)
