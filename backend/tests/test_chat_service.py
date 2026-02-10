"""チャットサービスのテスト"""
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.chat_service import build_prompt, stream_chat_response


class TestBuildPrompt:
    """プロンプト構築のテスト"""

    def test_builds_prompt_with_context(self) -> None:
        """問題コンテキストがプロンプトに含まれる"""
        prompt = build_prompt(
            question_content="活性化関数の役割は？",
            choices=["正規化", "非線形性の導入", "損失計算", "勾配計算"],
            correct_answer=1,
            explanation="活性化関数は非線形性を導入します。",
            history=[],
            user_message="もっと詳しく教えてください",
        )

        assert "活性化関数の役割は？" in prompt
        assert "非線形性の導入" in prompt
        assert "活性化関数は非線形性を導入します。" in prompt
        assert "もっと詳しく教えてください" in prompt

    def test_includes_history_in_prompt(self) -> None:
        """会話履歴がプロンプトに含まれる"""
        prompt = build_prompt(
            question_content="テスト問題",
            choices=["A", "B", "C", "D"],
            correct_answer=0,
            explanation="解説テキスト",
            history=[
                {"role": "user", "content": "最初の質問"},
                {"role": "assistant", "content": "最初の回答"},
            ],
            user_message="続きの質問",
        )

        assert "最初の質問" in prompt
        assert "最初の回答" in prompt
        assert "続きの質問" in prompt

    def test_includes_correct_answer_label(self) -> None:
        """正解の選択肢がラベル付きで表示される"""
        prompt = build_prompt(
            question_content="テスト問題",
            choices=["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
            correct_answer=2,
            explanation="解説テキスト",
            history=[],
            user_message="質問",
        )

        assert "C. 選択肢C" in prompt


class TestStreamChatResponse:
    """ストリーミングレスポンスのテスト"""

    @pytest.mark.asyncio
    async def test_streams_text_from_assistant_event(self) -> None:
        """assistantイベントのテキストがJSON encoded SSEでyieldされる"""
        # 実際のCLI出力: assistantイベントにテキストが入る
        mock_stdout_lines = [
            json.dumps({"type": "system", "subtype": "init"}) + "\n",
            json.dumps({"type": "assistant", "message": {"content": [{"type": "text", "text": "こんにちは、解説します"}]}}) + "\n",
            json.dumps({"type": "result", "subtype": "success", "result": "こんにちは、解説します"}) + "\n",
        ]

        mock_process = AsyncMock()
        mock_process.returncode = 0

        async def mock_readline():
            if mock_stdout_lines:
                return mock_stdout_lines.pop(0).encode()
            return b""

        mock_process.stdout = MagicMock()
        mock_process.stdout.readline = mock_readline
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"")
        mock_process.wait = AsyncMock(return_value=0)

        with patch("app.services.chat_service.asyncio") as mock_asyncio:
            mock_asyncio.create_subprocess_exec = AsyncMock(return_value=mock_process)

            chunks: list[str] = []
            async for chunk in stream_chat_response(
                question_content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
                explanation="解説",
                history=[],
                user_message="質問",
            ):
                chunks.append(chunk)

        assert len(chunks) == 1
        # SSEデータがJSON encodeされている
        assert chunks[0].startswith("data: ")
        assert chunks[0].endswith("\n\n")
        payload = json.loads(chunks[0][6:].strip())
        assert payload == "こんにちは、解説します"

    @pytest.mark.asyncio
    async def test_multiline_text_preserved_in_json(self) -> None:
        """複数行テキストがJSON encodeで改行を保持する"""
        multiline_text = "# タイトル\n\n段落1の説明です。\n\n段落2の説明です。"
        mock_stdout_lines = [
            json.dumps({"type": "assistant", "message": {"content": [{"type": "text", "text": multiline_text}]}}) + "\n",
            json.dumps({"type": "result", "subtype": "success", "result": multiline_text}) + "\n",
        ]

        mock_process = AsyncMock()
        mock_process.returncode = 0

        async def mock_readline():
            if mock_stdout_lines:
                return mock_stdout_lines.pop(0).encode()
            return b""

        mock_process.stdout = MagicMock()
        mock_process.stdout.readline = mock_readline
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"")
        mock_process.wait = AsyncMock(return_value=0)

        with patch("app.services.chat_service.asyncio") as mock_asyncio:
            mock_asyncio.create_subprocess_exec = AsyncMock(return_value=mock_process)

            chunks: list[str] = []
            async for chunk in stream_chat_response(
                question_content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
                explanation="解説",
                history=[],
                user_message="質問",
            ):
                chunks.append(chunk)

        # 1つのSSEイベントとしてyieldされる
        assert len(chunks) == 1
        # JSON decodeで元のテキスト（改行含む）を復元できる
        payload = json.loads(chunks[0][6:].strip())
        assert payload == multiline_text
        assert "\n" in payload

    @pytest.mark.asyncio
    async def test_handles_cli_error(self) -> None:
        """CLI失敗時のエラーハンドリング"""
        mock_process = AsyncMock()
        mock_process.returncode = 1

        async def mock_readline():
            return b""

        mock_process.stdout = MagicMock()
        mock_process.stdout.readline = mock_readline
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"CLI error occurred")
        mock_process.wait = AsyncMock(return_value=1)

        with patch("app.services.chat_service.asyncio") as mock_asyncio:
            mock_asyncio.create_subprocess_exec = AsyncMock(return_value=mock_process)
            mock_asyncio.subprocess = asyncio.subprocess

            chunks: list[str] = []
            async for chunk in stream_chat_response(
                question_content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
                explanation="解説",
                history=[],
                user_message="質問",
            ):
                chunks.append(chunk)

        assert len(chunks) >= 1
        assert any("error" in c.lower() or "エラー" in c for c in chunks)

    @pytest.mark.asyncio
    async def test_handles_invalid_json_lines(self) -> None:
        """不正なJSONの行はスキップされる"""
        mock_stdout_lines = [
            "not json\n",
            json.dumps({"type": "assistant", "message": {"content": [{"type": "text", "text": "有効なテキスト"}]}}) + "\n",
            json.dumps({"type": "result", "subtype": "success", "result": "有効なテキスト"}) + "\n",
        ]

        mock_process = AsyncMock()
        mock_process.returncode = 0

        async def mock_readline():
            if mock_stdout_lines:
                return mock_stdout_lines.pop(0).encode()
            return b""

        mock_process.stdout = MagicMock()
        mock_process.stdout.readline = mock_readline
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"")
        mock_process.wait = AsyncMock(return_value=0)

        with patch("app.services.chat_service.asyncio") as mock_asyncio:
            mock_asyncio.create_subprocess_exec = AsyncMock(return_value=mock_process)

            chunks: list[str] = []
            async for chunk in stream_chat_response(
                question_content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
                explanation="解説",
                history=[],
                user_message="質問",
            ):
                chunks.append(chunk)

        assert len(chunks) == 1
        payload = json.loads(chunks[0][6:].strip())
        assert payload == "有効なテキスト"

    @pytest.mark.asyncio
    async def test_ignores_non_text_content_blocks(self) -> None:
        """text以外のcontentブロックはスキップされる"""
        mock_stdout_lines = [
            json.dumps({"type": "assistant", "message": {"content": [
                {"type": "tool_use", "name": "some_tool"},
                {"type": "text", "text": "テキスト部分"},
            ]}}) + "\n",
            json.dumps({"type": "result", "subtype": "success"}) + "\n",
        ]

        mock_process = AsyncMock()
        mock_process.returncode = 0

        async def mock_readline():
            if mock_stdout_lines:
                return mock_stdout_lines.pop(0).encode()
            return b""

        mock_process.stdout = MagicMock()
        mock_process.stdout.readline = mock_readline
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"")
        mock_process.wait = AsyncMock(return_value=0)

        with patch("app.services.chat_service.asyncio") as mock_asyncio:
            mock_asyncio.create_subprocess_exec = AsyncMock(return_value=mock_process)

            chunks: list[str] = []
            async for chunk in stream_chat_response(
                question_content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
                explanation="解説",
                history=[],
                user_message="質問",
            ):
                chunks.append(chunk)

        # textブロックのみがyieldされる
        assert len(chunks) == 1
        payload = json.loads(chunks[0][6:].strip())
        assert payload == "テキスト部分"
