"""トピック機能の統合テスト

各コンポーネントのtopic対応を検証する
"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db
from app.models.mock_exam import MockExam, MockExamAnswer
from app.schemas.mock_exam import MockExamQuestionResponse
from app.schemas.question import QuestionResponse
from app.services.pdf_extractor import EXTRACTION_PROMPT


class TestSchemaTopicField:
    """スキーマにtopicフィールドが含まれること"""

    def test_mock_exam_question_response_has_topic(self) -> None:
        """MockExamQuestionResponseにtopicが含まれること"""
        response = MockExamQuestionResponse(
            question_index=0,
            question_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            content_type="plain",
            exam_area="応用数学",
            topic="ベイズ則",
        )
        assert response.topic == "ベイズ則"

    def test_mock_exam_question_response_topic_default_none(self) -> None:
        """MockExamQuestionResponseのtopicデフォルトはNone"""
        response = MockExamQuestionResponse(
            question_index=0,
            question_id=uuid.uuid4(),
            content="テスト問題",
            choices=["A", "B", "C", "D"],
            content_type="plain",
            exam_area="応用数学",
        )
        assert response.topic is None

    def test_question_response_has_topic(self) -> None:
        """QuestionResponseにtopicが含まれること"""
        response = QuestionResponse(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト",
            choices=["A", "B"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="test",
            topic="CNN",
        )
        assert response.topic == "CNN"

    def test_question_response_topic_default_none(self) -> None:
        """QuestionResponseのtopicデフォルトはNone"""
        response = QuestionResponse(
            id=uuid.uuid4(),
            category_id=uuid.uuid4(),
            content="テスト",
            choices=["A", "B"],
            correct_answer=0,
            explanation="解説",
            difficulty=3,
            source="test",
        )
        assert response.topic is None


class TestPdfExtractorTopicField:
    """EXTRACTION_PROMPTにtopicフィールドが含まれること"""

    def test_extraction_prompt_contains_topic(self) -> None:
        """EXTRACTION_PROMPTに"topic"が含まれること"""
        assert '"topic"' in EXTRACTION_PROMPT

    def test_extraction_prompt_topic_description(self) -> None:
        """EXTRACTION_PROMPTにtopicの説明が含まれること"""
        assert "トピック" in EXTRACTION_PROMPT or "topic" in EXTRACTION_PROMPT


class MockCategory:
    def __init__(self, name: str, parent_id=None) -> None:
        self.id = uuid.uuid4()
        self.name = name
        self.parent_id = parent_id


class MockQuestion:
    def __init__(self, category_id: uuid.UUID, topic: str | None = None) -> None:
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
        self.topic = topic


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
        return MagicMock(
            scalars=MagicMock(
                return_value=MagicMock(all=MagicMock(return_value=[]))
            )
        )

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def flush(self) -> None:
        pass

    async def commit(self) -> None:
        self._committed = True

    async def refresh(self, obj: object) -> None:
        pass


class TestStartMockExamWithTopic:
    """start_mock_examでtopicが伝搬されること"""

    @pytest.mark.asyncio
    async def test_start_mock_exam_includes_topic(self) -> None:
        """模試開始レスポンスにtopicが含まれること"""
        mock_db = MockDBSession()

        parent_cats = {
            "応用数学": MockCategory("応用数学"),
            "機械学習": MockCategory("機械学習"),
            "深層学習の基礎": MockCategory("深層学習の基礎"),
            "深層学習の応用": MockCategory("深層学習の応用"),
            "開発・運用環境": MockCategory("開発・運用環境"),
        }

        results = []
        for name, parent in parent_cats.items():
            parent_result = MagicMock()
            parent_result.scalar_one_or_none.return_value = parent
            results.append(parent_result)

            child_result = MagicMock()
            child_result.all.return_value = []
            results.append(child_result)

            # topicを持つ問題を作成
            questions = [MockQuestion(parent.id, topic="テストトピック") for _ in range(10)]
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
            # 各問題にtopicが含まれること
            assert "questions" in data
            assert len(data["questions"]) > 0
            first_q = data["questions"][0]
            assert "topic" in first_q
            assert first_q["topic"] == "テストトピック"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_start_mock_exam_topic_none(self) -> None:
        """topic未設定の問題ではtopicがnullであること"""
        mock_db = MockDBSession()

        parent_cats = {
            "応用数学": MockCategory("応用数学"),
            "機械学習": MockCategory("機械学習"),
            "深層学習の基礎": MockCategory("深層学習の基礎"),
            "深層学習の応用": MockCategory("深層学習の応用"),
            "開発・運用環境": MockCategory("開発・運用環境"),
        }

        results = []
        for name, parent in parent_cats.items():
            parent_result = MagicMock()
            parent_result.scalar_one_or_none.return_value = parent
            results.append(parent_result)

            child_result = MagicMock()
            child_result.all.return_value = []
            results.append(child_result)

            # topicなしの問題
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
            first_q = data["questions"][0]
            assert first_q["topic"] is None
        finally:
            app.dependency_overrides.clear()
