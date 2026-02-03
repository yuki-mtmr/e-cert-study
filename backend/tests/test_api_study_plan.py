"""学習プランAPIエンドポイントのテスト"""
import uuid
from datetime import date, datetime, timedelta
from typing import AsyncGenerator
from unittest.mock import MagicMock, AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.models.study_plan import StudyPlan, DailyGoal


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0
        self._added_objects: list[object] = []
        self._deleted_objects: list[object] = []

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()

    def add(self, obj: object) -> None:
        self._added_objects.append(obj)

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: object) -> None:
        pass

    async def delete(self, obj: object) -> None:
        self._deleted_objects.append(obj)


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.fixture
def sample_study_plan_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def sample_study_plan(sample_study_plan_id: uuid.UUID) -> StudyPlan:
    now = datetime.now()
    return StudyPlan(
        id=sample_study_plan_id,
        user_id="test_user_123",
        exam_date=date(2026, 3, 15),
        target_questions_per_day=20,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_create_study_plan(mock_db: MockDBSession) -> None:
    """学習プランを作成"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/study-plan",
                json={
                    "user_id": "test_user_123",
                    "exam_date": "2026-03-15",
                    "target_questions_per_day": 25,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["userId"] == "test_user_123"
        assert data["examDate"] == "2026-03-15"
        assert data["targetQuestionsPerDay"] == 25
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_study_plan(
    mock_db: MockDBSession,
    sample_study_plan: StudyPlan,
) -> None:
    """学習プランを取得"""
    result = MagicMock()
    result.scalars.return_value.first.return_value = sample_study_plan

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/study-plan?user_id=test_user_123")

        assert response.status_code == 200
        data = response.json()
        assert data["userId"] == "test_user_123"
        assert data["examDate"] == "2026-03-15"
        assert data["targetQuestionsPerDay"] == 20
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_study_plan_not_found(mock_db: MockDBSession) -> None:
    """存在しない学習プランを取得すると404"""
    result = MagicMock()
    result.scalars.return_value.first.return_value = None

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/study-plan?user_id=nonexistent_user")

        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_study_plan(
    mock_db: MockDBSession,
    sample_study_plan: StudyPlan,
) -> None:
    """学習プランを更新"""
    result = MagicMock()
    result.scalars.return_value.first.return_value = sample_study_plan

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.put(
                "/api/study-plan?user_id=test_user_123",
                json={
                    "exam_date": "2026-04-01",
                    "target_questions_per_day": 30,
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["examDate"] == "2026-04-01"
        assert data["targetQuestionsPerDay"] == 30
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_study_plan(
    mock_db: MockDBSession,
    sample_study_plan: StudyPlan,
) -> None:
    """学習プランを削除"""
    result = MagicMock()
    result.scalars.return_value.first.return_value = sample_study_plan

    mock_db.set_execute_results([result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.delete("/api/study-plan?user_id=test_user_123")

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Study plan deleted successfully"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_study_plan_summary(
    mock_db: MockDBSession,
    sample_study_plan: StudyPlan,
) -> None:
    """学習プランサマリーを取得"""
    # 学習プラン取得
    plan_result = MagicMock()
    plan_result.scalars.return_value.first.return_value = sample_study_plan

    # 日別進捗データ
    today = date.today()
    daily_goals_result = MagicMock()
    daily_goals_result.scalars.return_value.all.return_value = [
        DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=sample_study_plan.id,
            date=today - timedelta(days=2),
            target_count=20,
            actual_count=22,
            correct_count=18,
        ),
        DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=sample_study_plan.id,
            date=today - timedelta(days=1),
            target_count=20,
            actual_count=20,
            correct_count=16,
        ),
        DailyGoal(
            id=uuid.uuid4(),
            study_plan_id=sample_study_plan.id,
            date=today,
            target_count=20,
            actual_count=10,
            correct_count=8,
        ),
    ]

    # 連続学習日数
    streak_result = MagicMock()
    streak_result.scalar.return_value = 3

    mock_db.set_execute_results([plan_result, daily_goals_result, streak_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/study-plan/summary?user_id=test_user_123")

        assert response.status_code == 200
        data = response.json()
        assert "daysRemaining" in data
        assert "totalAnswered" in data
        assert "totalCorrect" in data
        assert "accuracy" in data
        assert "streak" in data
        assert "dailyProgress" in data
    finally:
        app.dependency_overrides.clear()
