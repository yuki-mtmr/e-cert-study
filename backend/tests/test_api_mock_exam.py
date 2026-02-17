"""模試APIエンドポイントテスト

Sprint 3: 全エンドポイントの統合テスト
"""
import uuid
from datetime import datetime
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.models.mock_exam import MockExam, MockExamAnswer


class MockCategory:
    def __init__(self, name: str, parent_id=None) -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = parent_id


class MockQuestion:
    def __init__(self, category_id: uuid.UUID) -> None:
        self.id = uuid.uuid4()
        self.category_id = category_id
        self.content = "テスト問題"
        self.choices = ["A", "B", "C", "D"]
        self.correct_answer = 0
        self.explanation = "解説"
        self.difficulty = 3
        self.source = "test"
        self.content_type = "plain"
        self.images = []
        self.topic = None


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._execute_index = 0
        self.added_objects: list[object] = []
        self._committed = False

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._execute_index = 0

    async def execute(self, query: object) -> MagicMock:
        if self._execute_index < len(self._execute_results):
            result = self._execute_results[self._execute_index]
            self._execute_index += 1
            return result
        return MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[]))))

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        self._committed = True

    async def refresh(self, obj: object) -> None:
        pass


def _make_mock_exam(
    exam_id: uuid.UUID | None = None,
    user_id: str = "test-user",
    status: str = "in_progress",
    score: float = 0.0,
    correct_count: int = 0,
    passed: bool | None = None,
    category_scores: dict | None = None,
    ai_analysis: str | None = None,
) -> MockExam:
    """テスト用MockExamオブジェクト"""
    exam = MagicMock(spec=MockExam)
    exam.id = exam_id or uuid.uuid4()
    exam.user_id = user_id
    exam.started_at = datetime.utcnow()
    exam.finished_at = None if status == "in_progress" else datetime.utcnow()
    exam.total_questions = 100
    exam.correct_count = correct_count
    exam.score = score
    exam.passed = passed
    exam.category_scores = category_scores
    exam.ai_analysis = ai_analysis
    exam.status = status
    exam.answers = []
    return exam


@pytest.mark.asyncio
async def test_start_mock_exam() -> None:
    """模試開始エンドポイント"""
    mock_db = MockDBSession()

    # 5つの親カテゴリと子カテゴリをセットアップ
    parent_cats = {
        "応用数学": MockCategory("応用数学"),
        "機械学習": MockCategory("機械学習"),
        "深層学習の基礎": MockCategory("深層学習の基礎"),
        "深層学習の応用": MockCategory("深層学習の応用"),
        "開発・運用環境": MockCategory("開発・運用環境"),
    }

    results = []
    for name, parent in parent_cats.items():
        # 親カテゴリ検索結果
        parent_result = MagicMock()
        parent_result.scalar_one_or_none.return_value = parent
        results.append(parent_result)

        # 子カテゴリID検索結果
        child_result = MagicMock()
        child_result.all.return_value = []  # 子カテゴリなし
        results.append(child_result)

        # 問題検索結果
        questions = [MockQuestion(parent.id) for _ in range(10)]
        q_result = MagicMock()
        q_result.scalars.return_value = MagicMock(all=MagicMock(return_value=questions))
        results.append(q_result)

    mock_db.set_execute_results(results)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                "/api/mock-exam/start",
                json={"user_id": "test-user"},
            )
        assert response.status_code == 200
        data = response.json()
        assert "exam_id" in data
        assert data["total_questions"] > 0
        assert data["time_limit_minutes"] == 120
        assert "questions" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_answer_mock_exam() -> None:
    """回答送信エンドポイント"""
    mock_db = MockDBSession()
    exam_id = uuid.uuid4()

    # 模試取得結果
    mock_exam = _make_mock_exam(exam_id=exam_id)
    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = mock_exam

    # 回答検索結果
    mock_answer = MagicMock(spec=MockExamAnswer)
    mock_answer.question_index = 0
    mock_answer.selected_answer = None
    mock_answer.question_id = uuid.uuid4()

    # Questionの正解を設定
    mock_question = MagicMock()
    mock_question.correct_answer = 0

    answer_result = MagicMock()
    answer_result.scalar_one_or_none.return_value = mock_answer

    question_result = MagicMock()
    question_result.scalar_one_or_none.return_value = mock_question

    mock_db.set_execute_results([exam_result, answer_result, question_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                f"/api/mock-exam/{exam_id}/answer",
                json={"question_index": 0, "selected_answer": 0},
            )
        assert response.status_code == 200
        data = response.json()
        assert "question_index" in data
        assert "is_correct" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_finish_mock_exam() -> None:
    """模試終了エンドポイント"""
    mock_db = MockDBSession()
    exam_id = uuid.uuid4()

    mock_exam = _make_mock_exam(exam_id=exam_id)
    mock_exam.answers = []

    # 模試取得
    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = mock_exam

    mock_db.set_execute_results([exam_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                f"/api/mock-exam/{exam_id}/finish",
                json={"user_id": "test-user"},
            )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "passed" in data
        assert "category_scores" in data
        assert "analysis" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mock_exam_result() -> None:
    """結果取得エンドポイント"""
    mock_db = MockDBSession()
    exam_id = uuid.uuid4()

    mock_exam = _make_mock_exam(
        exam_id=exam_id,
        status="finished",
        score=72.0,
        correct_count=72,
        passed=True,
        category_scores={
            "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
        },
    )

    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = mock_exam

    mock_db.set_execute_results([exam_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(f"/api/mock-exam/{exam_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 72.0
        assert data["passed"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_mock_exam_history() -> None:
    """履歴取得エンドポイント"""
    mock_db = MockDBSession()

    mock_exam = _make_mock_exam(status="finished", score=72.0, passed=True)

    # 履歴クエリ
    exams_result = MagicMock()
    exams_result.scalars.return_value = MagicMock(all=MagicMock(return_value=[mock_exam]))

    # カウントクエリ
    count_result = MagicMock()
    count_result.scalar_one.return_value = 1

    mock_db.set_execute_results([exams_result, count_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/mock-exam/history?user_id=test-user")
        assert response.status_code == 200
        data = response.json()
        assert "exams" in data
        assert "total_count" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_analysis_endpoint() -> None:
    """AI分析エンドポイント"""
    mock_db = MockDBSession()
    exam_id = uuid.uuid4()

    mock_exam = _make_mock_exam(
        exam_id=exam_id,
        status="finished",
        score=72.0,
        correct_count=72,
        passed=True,
        category_scores={
            "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
        },
    )

    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = mock_exam

    mock_db.set_execute_results([exam_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        with patch(
            "app.api.mock_exam.generate_ai_analysis",
            new_callable=AsyncMock,
            return_value="AI分析結果テスト",
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    f"/api/mock-exam/{exam_id}/ai-analysis",
                    json={"user_id": "test-user"},
                )
        assert response.status_code == 200
        data = response.json()
        assert data["ai_analysis"] == "AI分析結果テスト"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_ai_analysis_failure_returns_503() -> None:
    """AI分析生成失敗時に503が返ること"""
    mock_db = MockDBSession()
    exam_id = uuid.uuid4()

    mock_exam = _make_mock_exam(
        exam_id=exam_id,
        status="finished",
        score=72.0,
        correct_count=72,
        passed=True,
        category_scores={
            "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
        },
    )

    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = mock_exam

    mock_db.set_execute_results([exam_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        with patch(
            "app.api.mock_exam.generate_ai_analysis",
            new_callable=AsyncMock,
            return_value=None,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    f"/api/mock-exam/{exam_id}/ai-analysis",
                    json={"user_id": "test-user"},
                )
        assert response.status_code == 503
        data = response.json()
        assert "AI分析の生成に失敗しました" in data["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_nonexistent_exam() -> None:
    """存在しない模試取得で404"""
    mock_db = MockDBSession()
    exam_result = MagicMock()
    exam_result.scalar_one_or_none.return_value = None
    mock_db.set_execute_results([exam_result])

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get(f"/api/mock-exam/{uuid.uuid4()}")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_history_requires_user_id() -> None:
    """履歴取得にuser_idが必須"""
    mock_db = MockDBSession()

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.get("/api/mock-exam/history")
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
