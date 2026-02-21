"""Claude CLI共通モジュールのテスト"""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.claude_cli import ClaudeCLIError, call_claude_cli


class TestCallClaudeCli:
    """call_claude_cli共通関数のテスト"""

    @pytest.mark.asyncio
    async def test_success_returns_stdout(self) -> None:
        """正常時にstdoutを返す"""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"response text", b"")

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            result = await call_claude_cli("test prompt")
            assert result == "response text"

    @pytest.mark.asyncio
    async def test_nonzero_returncode_raises_error(self) -> None:
        """異常終了時にClaudeCLIErrorを投げる"""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b"", b"error message")

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            with pytest.raises(ClaudeCLIError) as exc_info:
                await call_claude_cli("test prompt")
            assert "error message" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_empty_response_raises_error(self) -> None:
        """空レスポンス時にClaudeCLIErrorを投げる"""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"   ", b"")

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            with pytest.raises(ClaudeCLIError, match="empty response"):
                await call_claude_cli("test prompt")

    @pytest.mark.asyncio
    async def test_calls_claude_with_correct_args(self) -> None:
        """claude -p <prompt> で呼び出す"""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"ok", b"")

        with patch("asyncio.create_subprocess_exec", return_value=mock_process) as mock_exec:
            await call_claude_cli("my prompt")
            mock_exec.assert_called_once()
            args = mock_exec.call_args[0]
            assert args == ("claude", "-p", "my prompt")


class TestClaudeCLIError:
    """ClaudeCLIErrorのテスト"""

    def test_is_exception_subclass(self) -> None:
        """Exceptionのサブクラスである"""
        assert issubclass(ClaudeCLIError, Exception)

    def test_can_be_raised_and_caught(self) -> None:
        """raiseしてcatchできる"""
        with pytest.raises(ClaudeCLIError):
            raise ClaudeCLIError("test error")
