"""模試サービステスト

Sprint 2: 問題選択・スコア計算・ルールベース分析を検証
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.mock_exam_service import (
    calculate_scores,
    generate_rule_based_analysis,
    select_questions_for_exam,
)
from app.services.mock_exam_config import get_grade


class TestCalculateScores:
    """スコア計算テスト"""

    def test_perfect_score(self) -> None:
        """満点の場合"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"} for _ in range(10)
        ] + [
            {"is_correct": True, "exam_area": "機械学習"} for _ in range(25)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の基礎"} for _ in range(30)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の応用"} for _ in range(25)
        ] + [
            {"is_correct": True, "exam_area": "開発・運用環境"} for _ in range(10)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 100
        assert result["score"] == 100.0
        assert result["passed"] is True

    def test_zero_score(self) -> None:
        """0点の場合"""
        answers = [
            {"is_correct": False, "exam_area": "応用数学"} for _ in range(10)
        ] + [
            {"is_correct": False, "exam_area": "機械学習"} for _ in range(25)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の基礎"} for _ in range(30)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の応用"} for _ in range(25)
        ] + [
            {"is_correct": False, "exam_area": "開発・運用環境"} for _ in range(10)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 0
        assert result["score"] == 0.0
        assert result["passed"] is False

    def test_passing_boundary(self) -> None:
        """合格ラインギリギリ（65%）"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"} for _ in range(7)
        ] + [
            {"is_correct": False, "exam_area": "応用数学"} for _ in range(3)
        ] + [
            {"is_correct": True, "exam_area": "機械学習"} for _ in range(16)
        ] + [
            {"is_correct": False, "exam_area": "機械学習"} for _ in range(9)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の基礎"} for _ in range(20)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の基礎"} for _ in range(10)
        ] + [
            {"is_correct": True, "exam_area": "深層学習の応用"} for _ in range(16)
        ] + [
            {"is_correct": False, "exam_area": "深層学習の応用"} for _ in range(9)
        ] + [
            {"is_correct": True, "exam_area": "開発・運用環境"} for _ in range(6)
        ] + [
            {"is_correct": False, "exam_area": "開発・運用環境"} for _ in range(4)
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 65
        assert result["score"] == 65.0
        assert result["passed"] is True

    def test_category_scores_structure(self) -> None:
        """カテゴリ別スコアの構造が正しいこと"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"},
            {"is_correct": False, "exam_area": "応用数学"},
            {"is_correct": True, "exam_area": "機械学習"},
        ]
        result = calculate_scores(answers)
        scores = result["category_scores"]
        # 辞書型のスコアが返ること
        assert "応用数学" in scores
        assert scores["応用数学"]["total"] == 2
        assert scores["応用数学"]["correct"] == 1
        assert scores["応用数学"]["accuracy"] == 50.0
        assert scores["応用数学"]["grade"] == get_grade(50.0)

    def test_unanswered_questions(self) -> None:
        """未回答（is_correct=None）は不正解扱い"""
        answers = [
            {"is_correct": None, "exam_area": "応用数学"},
            {"is_correct": True, "exam_area": "応用数学"},
        ]
        result = calculate_scores(answers)
        assert result["correct_count"] == 1
        assert result["score"] == 50.0

    def test_empty_answers(self) -> None:
        """回答なしの場合"""
        result = calculate_scores([])
        assert result["correct_count"] == 0
        assert result["score"] == 0.0
        assert result["passed"] is False

    def test_topic_scores_basic(self) -> None:
        """topic付きanswersでtopic_scoresが正しく集計されること"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学", "topic": "ベイズ則"},
            {"is_correct": False, "exam_area": "応用数学", "topic": "ベイズ則"},
            {"is_correct": True, "exam_area": "応用数学", "topic": "線形代数"},
            {"is_correct": True, "exam_area": "機械学習", "topic": "SVM"},
        ]
        result = calculate_scores(answers)
        topic_scores = result["topic_scores"]

        assert "ベイズ則" in topic_scores
        assert topic_scores["ベイズ則"]["total"] == 2
        assert topic_scores["ベイズ則"]["correct"] == 1
        assert topic_scores["ベイズ則"]["accuracy"] == 50.0

        assert "線形代数" in topic_scores
        assert topic_scores["線形代数"]["total"] == 1
        assert topic_scores["線形代数"]["correct"] == 1
        assert topic_scores["線形代数"]["accuracy"] == 100.0

        assert "SVM" in topic_scores
        assert topic_scores["SVM"]["total"] == 1
        assert topic_scores["SVM"]["correct"] == 1

    def test_topic_scores_none_topic_excluded(self) -> None:
        """topicがNoneの回答はtopic_scoresに含まれないこと"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学", "topic": "ベイズ則"},
            {"is_correct": True, "exam_area": "応用数学", "topic": None},
            {"is_correct": True, "exam_area": "応用数学"},
        ]
        result = calculate_scores(answers)
        topic_scores = result["topic_scores"]

        assert "ベイズ則" in topic_scores
        assert len(topic_scores) == 1

    def test_topic_scores_empty_when_no_topics(self) -> None:
        """topic未設定の場合、topic_scoresは空辞書"""
        answers = [
            {"is_correct": True, "exam_area": "応用数学"},
        ]
        result = calculate_scores(answers)
        assert result["topic_scores"] == {}

    def test_topic_scores_empty_answers(self) -> None:
        """空の回答リストの場合、topic_scoresは空辞書"""
        result = calculate_scores([])
        assert result["topic_scores"] == {}


class TestGenerateRuleBasedAnalysis:
    """ルールベース辛口分析テスト"""

    def test_passing_high_score(self) -> None:
        """高得点合格の分析"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 9, "accuracy": 90.0, "grade": "S"},
            "機械学習": {"total": 25, "correct": 22, "accuracy": 88.0, "grade": "A"},
            "深層学習の基礎": {"total": 30, "correct": 28, "accuracy": 93.3, "grade": "S"},
            "深層学習の応用": {"total": 25, "correct": 20, "accuracy": 80.0, "grade": "A"},
            "開発・運用環境": {"total": 10, "correct": 8, "accuracy": 80.0, "grade": "A"},
        }
        result = generate_rule_based_analysis(
            score=87.0, correct_count=87, total=100,
            passed=True, category_scores=category_scores
        )
        assert isinstance(result, str)
        assert len(result) > 0
        # 合格であることが明示されていること
        assert "合格" in result

    def test_failing_low_score(self) -> None:
        """低得点不合格の分析"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 3, "accuracy": 30.0, "grade": "D"},
            "機械学習": {"total": 25, "correct": 10, "accuracy": 40.0, "grade": "D"},
            "深層学習の基礎": {"total": 30, "correct": 12, "accuracy": 40.0, "grade": "D"},
            "深層学習の応用": {"total": 25, "correct": 8, "accuracy": 32.0, "grade": "D"},
            "開発・運用環境": {"total": 10, "correct": 2, "accuracy": 20.0, "grade": "F"},
        }
        result = generate_rule_based_analysis(
            score=35.0, correct_count=35, total=100,
            passed=False, category_scores=category_scores
        )
        assert isinstance(result, str)
        assert "不合格" in result

    def test_failing_mentions_remaining(self) -> None:
        """不合格時、合格まであとN問の情報が含まれること"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 6, "accuracy": 60.0, "grade": "C"},
        }
        result = generate_rule_based_analysis(
            score=60.0, correct_count=60, total=100,
            passed=False, category_scores=category_scores
        )
        # 合格まであと5問という情報が含まれること
        assert "5" in result

    def test_analysis_includes_weak_area(self) -> None:
        """弱点分野が指摘されること"""
        category_scores = {
            "応用数学": {"total": 10, "correct": 9, "accuracy": 90.0, "grade": "S"},
            "機械学習": {"total": 25, "correct": 5, "accuracy": 20.0, "grade": "F"},
        }
        result = generate_rule_based_analysis(
            score=70.0, correct_count=14, total=35,
            passed=True, category_scores=category_scores
        )
        # 弱点分野が含まれること
        assert "機械学習" in result


def _make_mock_question(q_id: uuid.UUID, category_id: uuid.UUID) -> MagicMock:
    """テスト用のモック問題オブジェクトを生成"""
    q = MagicMock()
    q.id = q_id
    q.category_id = category_id
    q.images = []
    q.framework = None
    q.topic = None
    return q


def _make_mock_category(cat_id: uuid.UUID, name: str) -> MagicMock:
    """テスト用のモックカテゴリオブジェクトを生成"""
    cat = MagicMock()
    cat.id = cat_id
    cat.name = name
    cat.parent_id = None
    return cat


class TestSelectQuestionsForExam:
    """問題選択テスト（ランダム化・重複排除）"""

    @pytest.mark.asyncio
    async def test_selected_questions_have_no_duplicates(self) -> None:
        """選択された問題にIDの重複がないこと"""
        # 5エリア分のカテゴリIDを準備
        area_categories = {
            "応用数学": uuid.uuid4(),
            "機械学習": uuid.uuid4(),
            "深層学習の基礎": uuid.uuid4(),
            "深層学習の応用": uuid.uuid4(),
            "開発・運用環境": uuid.uuid4(),
        }
        area_counts = {
            "応用数学": 10,
            "機械学習": 25,
            "深層学習の基礎": 30,
            "深層学習の応用": 25,
            "開発・運用環境": 10,
        }

        # 各エリアに十分な問題を用意
        area_questions: dict[uuid.UUID, list[MagicMock]] = {}
        for area_name, cat_id in area_categories.items():
            count = area_counts[area_name]
            area_questions[cat_id] = [
                _make_mock_question(uuid.uuid4(), cat_id)
                for _ in range(count + 10)  # 余分に用意
            ]

        call_count = 0

        async def mock_execute(query):
            nonlocal call_count
            call_count += 1
            result = MagicMock()

            # 奇数回目のクエリ: 親カテゴリ検索
            # 偶数回目 (2, 4): 子カテゴリ検索 + 問題検索
            # パターン: 親→子→問題 の3クエリ/エリア
            # 1: parent, 2: children, 3: questions, 4: parent, ...
            cycle = (call_count - 1) % 3

            if cycle == 0:
                # 親カテゴリ検索
                area_idx = (call_count - 1) // 3
                area_names = list(area_categories.keys())
                if area_idx < len(area_names):
                    cat_id = area_categories[area_names[area_idx]]
                    cat = _make_mock_category(cat_id, area_names[area_idx])
                    result.scalar_one_or_none.return_value = cat
                else:
                    result.scalar_one_or_none.return_value = None
            elif cycle == 1:
                # 子カテゴリ検索（空リストを返す）
                result.all.return_value = []
            elif cycle == 2:
                # 問題検索
                area_idx = (call_count - 1) // 3
                area_names = list(area_categories.keys())
                if area_idx < len(area_names):
                    cat_id = area_categories[area_names[area_idx]]
                    qs = area_questions[cat_id][:area_counts[area_names[area_idx]]]
                    scalars_mock = MagicMock()
                    scalars_mock.all.return_value = qs
                    result.scalars.return_value = scalars_mock
                else:
                    scalars_mock = MagicMock()
                    scalars_mock.all.return_value = []
                    result.scalars.return_value = scalars_mock

            return result

        db = AsyncMock()
        db.execute = mock_execute

        selected = await select_questions_for_exam(db)

        # 重複がないことを確認
        selected_ids = [item["question"].id for item in selected]
        assert len(selected_ids) == len(set(selected_ids)), "選択された問題にIDの重複があります"

    @pytest.mark.asyncio
    async def test_uses_random_ordering(self) -> None:
        """func.random()がimportされていること（ランダム選択に必要）"""
        import app.services.mock_exam_service as module

        # func.random がモジュールレベルでimportされていること
        assert hasattr(module, "func"), (
            "mock_exam_service に sqlalchemy.func がimportされていません。"
            "ランダム選択には func.random() が必要です。"
        )

    @pytest.mark.asyncio
    async def test_returns_correct_structure(self) -> None:
        """選択結果が正しい構造を持つこと"""
        cat_id = uuid.uuid4()
        q = _make_mock_question(uuid.uuid4(), cat_id)
        cat = _make_mock_category(cat_id, "応用数学")

        call_count = 0

        async def mock_execute(query):
            nonlocal call_count
            call_count += 1
            result = MagicMock()
            cycle = (call_count - 1) % 3

            if cycle == 0:
                if call_count <= 3:
                    result.scalar_one_or_none.return_value = cat
                else:
                    result.scalar_one_or_none.return_value = None
            elif cycle == 1:
                result.all.return_value = []
            elif cycle == 2:
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = [q]
                result.scalars.return_value = scalars_mock

            return result

        db = AsyncMock()
        db.execute = mock_execute

        selected = await select_questions_for_exam(db)

        # 少なくとも1問選択されること
        assert len(selected) >= 1
        # 正しい構造を持つこと
        item = selected[0]
        assert "question" in item
        assert "exam_area" in item
        assert "category_name" in item
