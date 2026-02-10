"""チャットAPIエンドポイントのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockQuestion:
    """テスト用の問題モック"""

    def __init__(self) -> None:
        self.id = uuid.UUID("12345678-1234-1234-1234-123456789abc")
        self.category_id = uuid.uuid4()
        self.content = "テスト問題"
        self.choices = ["A", "B", "C", "D"]
        self.correct_answer = 1
        self.explanation = "解説テキスト"
        self.difficulty = 3
        self.source = "テスト問題集"
        self.content_type = "plain"
        self.images = []


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_result: MagicMock | None = None

    def set_execute_result(self, result: MagicMock) -> None:
        self._execute_result = result

    async def execute(self, query: object) -> MagicMock:
        return self._execute_result  # type: ignore

    def add(self, obj: object) -> None:
        pass

    async def commit(self) -> None:
        pass


@pytest.fixture
def mock_db() -> MockDBSession:
    return MockDBSession()


@pytest.fixture
def mock_question() -> MockQuestion:
    return MockQuestion()


@pytest.mark.asyncio
async def test_chat_returns_streaming_response(
    mock_db: MockDBSession, mock_question: MockQuestion
) -> None:
    """SSEストリーミングレスポンスが返る"""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_question
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async def mock_stream(*args, **kwargs):
        yield "data: テスト回答\n\n"

    try:
        with patch(
            "app.api.chat.stream_chat_response",
            return_value=mock_stream(),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    f"/api/questions/{mock_question.id}/chat",
                    json={"message": "質問です", "history": []},
                )

            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
            assert "テスト回答" in response.text
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_404_for_invalid_question(mock_db: MockDBSession) -> None:
    """存在しない問題IDで404"""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            response = await client.post(
                f"/api/questions/{uuid.uuid4()}/chat",
                json={"message": "質問です"},
            )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_validates_request(mock_db: MockDBSession) -> None:
    """不正リクエストで422"""
    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            # 空のメッセージ
            response = await client.post(
                f"/api/questions/{uuid.uuid4()}/chat",
                json={"message": ""},
            )

        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_with_history(
    mock_db: MockDBSession, mock_question: MockQuestion
) -> None:
    """会話履歴付きリクエストが正しく処理される"""
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_question
    mock_db.set_execute_result(mock_result)

    async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async def mock_stream(*args, **kwargs):
        yield "data: 追加回答\n\n"

    try:
        with patch(
            "app.api.chat.stream_chat_response",
            return_value=mock_stream(),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    f"/api/questions/{mock_question.id}/chat",
                    json={
                        "message": "追加質問です",
                        "history": [
                            {"role": "user", "content": "最初の質問"},
                            {"role": "assistant", "content": "最初の回答"},
                        ],
                    },
                )

            assert response.status_code == 200
            assert "追加回答" in response.text
    finally:
        app.dependency_overrides.clear()
