"""Claude CLI共通モジュール

Claude Code CLIのsubprocess呼び出しを一元管理する
"""
import asyncio
import logging

logger = logging.getLogger(__name__)


class ClaudeCLIError(Exception):
    """Claude CLI呼び出しエラー"""

    pass


async def call_claude_cli(prompt: str) -> str:
    """
    Claude Code CLIをsubprocessで呼び出してレスポンスを取得

    Args:
        prompt: 送信するプロンプト

    Returns:
        Claudeからのレスポンステキスト

    Raises:
        ClaudeCLIError: CLI呼び出しに失敗した場合、または空レスポンスの場合
    """
    logger.debug(f"Calling Claude CLI with prompt length: {len(prompt)} chars")

    process = await asyncio.create_subprocess_exec(
        "claude", "-p", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()

    stdout_text = stdout.decode()
    stderr_text = stderr.decode()

    if process.returncode != 0:
        logger.error(f"Claude CLI failed with return code {process.returncode}")
        logger.error(f"stdout: {stdout_text[:500] if stdout_text else '(empty)'}")
        logger.error(f"stderr: {stderr_text[:500] if stderr_text else '(empty)'}")
        raise ClaudeCLIError(
            f"Claude CLI error (code={process.returncode}): "
            f"{stderr_text or stdout_text or 'Unknown error'}"
        )

    if not stdout_text.strip():
        logger.error("Claude CLI returned empty response")
        raise ClaudeCLIError("Claude CLI returned empty response")

    logger.debug(f"Claude CLI response length: {len(stdout_text)} chars")
    return stdout_text
