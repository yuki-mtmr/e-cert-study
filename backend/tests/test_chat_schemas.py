"""チャットスキーマのテスト"""
import pytest
from pydantic import ValidationError

from app.schemas.chat import ChatMessage, ChatRequest


class TestChatMessage:
    """ChatMessageスキーマのテスト"""

    def test_valid_user_message(self) -> None:
        """ユーザーメッセージが正しく作成できる"""
        msg = ChatMessage(role="user", content="質問です")
        assert msg.role == "user"
        assert msg.content == "質問です"

    def test_valid_assistant_message(self) -> None:
        """アシスタントメッセージが正しく作成できる"""
        msg = ChatMessage(role="assistant", content="回答です")
        assert msg.role == "assistant"
        assert msg.content == "回答です"

    def test_invalid_role_rejected(self) -> None:
        """不正なroleは拒否される"""
        with pytest.raises(ValidationError):
            ChatMessage(role="system", content="テスト")

    def test_empty_content_rejected(self) -> None:
        """空のcontentは拒否される"""
        with pytest.raises(ValidationError):
            ChatMessage(role="user", content="")


class TestChatRequest:
    """ChatRequestスキーマのテスト"""

    def test_valid_request_without_history(self) -> None:
        """履歴なしのリクエストが正しく作成できる"""
        req = ChatRequest(message="質問です")
        assert req.message == "質問です"
        assert req.history == []

    def test_valid_request_with_history(self) -> None:
        """履歴付きのリクエストが正しく作成できる"""
        req = ChatRequest(
            message="追加質問です",
            history=[
                ChatMessage(role="user", content="最初の質問"),
                ChatMessage(role="assistant", content="最初の回答"),
            ],
        )
        assert req.message == "追加質問です"
        assert len(req.history) == 2
        assert req.history[0].role == "user"

    def test_empty_message_rejected(self) -> None:
        """空のメッセージは拒否される"""
        with pytest.raises(ValidationError):
            ChatRequest(message="")
