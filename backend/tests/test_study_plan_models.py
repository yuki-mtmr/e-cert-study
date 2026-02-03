"""学習プランモデルのテスト"""
import uuid
from datetime import date, datetime

import pytest

from app.models.study_plan import StudyPlan, DailyGoal


class TestStudyPlanModel:
    """学習プランモデルのテスト"""

    def test_study_plan_has_required_fields(self) -> None:
        """学習プランモデルに必須フィールドがあることを確認"""
        now = datetime.now()
        study_plan = StudyPlan(
            id=uuid.uuid4(),
            user_id="test_user_123",
            exam_date=date(2026, 3, 15),
            target_questions_per_day=20,
            created_at=now,
            updated_at=now,
        )
        assert study_plan.id is not None
        assert study_plan.user_id == "test_user_123"
        assert study_plan.exam_date == date(2026, 3, 15)
        assert study_plan.target_questions_per_day == 20
        assert study_plan.created_at is not None
        assert study_plan.updated_at is not None

    def test_study_plan_with_custom_target(self) -> None:
        """カスタム目標数を設定できることを確認"""
        study_plan = StudyPlan(
            id=uuid.uuid4(),
            user_id="test_user_456",
            exam_date=date(2026, 4, 1),
            target_questions_per_day=30,
        )
        assert study_plan.target_questions_per_day == 30

    def test_study_plan_daily_goals_relationship(self) -> None:
        """日次目標とのリレーションシップが存在することを確認"""
        study_plan = StudyPlan(
            id=uuid.uuid4(),
            user_id="test_user_789",
            exam_date=date(2026, 5, 1),
        )
        # リレーションシップ属性が存在することを確認
        assert hasattr(study_plan, 'daily_goals')


class TestDailyGoalModel:
    """日次目標モデルのテスト"""

    def test_daily_goal_has_required_fields(self) -> None:
        """日次目標モデルに必須フィールドがあることを確認"""
        study_plan_id = uuid.uuid4()
        daily_goal = DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=study_plan_id,
            date=date(2026, 2, 3),
            target_count=20,
            actual_count=0,
            correct_count=0,
        )
        assert daily_goal.id is not None
        assert daily_goal.study_plan_id == study_plan_id
        assert daily_goal.date == date(2026, 2, 3)
        assert daily_goal.target_count == 20
        assert daily_goal.actual_count == 0
        assert daily_goal.correct_count == 0

    def test_daily_goal_with_actual_progress(self) -> None:
        """実際の進捗を記録できることを確認"""
        daily_goal = DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=uuid.uuid4(),
            date=date(2026, 2, 3),
            target_count=20,
            actual_count=25,
            correct_count=20,
        )
        assert daily_goal.actual_count == 25
        assert daily_goal.correct_count == 20

    def test_daily_goal_study_plan_relationship(self) -> None:
        """学習プランとのリレーションシップが存在することを確認"""
        daily_goal = DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=uuid.uuid4(),
            date=date(2026, 2, 3),
            target_count=20,
        )
        # リレーションシップ属性が存在することを確認
        assert hasattr(daily_goal, 'study_plan')
