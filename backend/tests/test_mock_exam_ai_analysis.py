"""模試AI分析テスト

Sprint 2: Claude CLI呼び出しのモック検証
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.mock_exam_ai_analysis import generate_ai_analysis


@pytest.mark.asyncio
async def test_generate_ai_analysis_calls_cli() -> None:
    """Claude CLIが呼び出されること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_claude_cli",
        new_callable=AsyncMock,
        return_value="AI分析結果テスト",
    ) as mock_cli:
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
        )
        mock_cli.assert_called_once()
        assert result == "AI分析結果テスト"


@pytest.mark.asyncio
async def test_generate_ai_analysis_prompt_content() -> None:
    """プロンプトにスコア情報が含まれること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_claude_cli",
        new_callable=AsyncMock,
        return_value="結果",
    ) as mock_cli:
        await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
        )
        prompt = mock_cli.call_args[0][0]
        assert "70.0" in prompt
        assert "応用数学" in prompt


@pytest.mark.asyncio
async def test_generate_ai_analysis_failure() -> None:
    """CLI失敗時にNoneを返すこと"""
    with patch(
        "app.services.mock_exam_ai_analysis.call_claude_cli",
        new_callable=AsyncMock,
        side_effect=Exception("CLI error"),
    ):
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores={},
        )
        assert result is None
