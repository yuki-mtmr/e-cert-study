"""模試AI分析テスト

Anthropic API呼び出しのモック検証
"""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.mock_exam_ai_analysis import generate_ai_analysis


@pytest.mark.asyncio
async def test_generate_ai_analysis_calls_api() -> None:
    """Anthropic APIが呼び出されること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_anthropic_api",
        new_callable=AsyncMock,
        return_value="AI分析結果テスト",
    ) as mock_api:
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
        )
        mock_api.assert_called_once()
        assert result == "AI分析結果テスト"


@pytest.mark.asyncio
async def test_generate_ai_analysis_prompt_content() -> None:
    """プロンプトにスコア情報が含まれること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_anthropic_api",
        new_callable=AsyncMock,
        return_value="結果",
    ) as mock_api:
        await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
        )
        prompt = mock_api.call_args[0][0]
        assert "70.0" in prompt
        assert "応用数学" in prompt


@pytest.mark.asyncio
async def test_generate_ai_analysis_with_topic_scores() -> None:
    """topic_scoresがプロンプトに反映されること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    topic_scores = {
        "ベイズ則": {"total": 3, "correct": 1, "accuracy": 33.3},
        "線形代数": {"total": 2, "correct": 2, "accuracy": 100.0},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_anthropic_api",
        new_callable=AsyncMock,
        return_value="トピック別分析結果",
    ) as mock_api:
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
            topic_scores=topic_scores,
        )
        mock_api.assert_called_once()
        prompt = mock_api.call_args[0][0]
        assert "ベイズ則" in prompt
        assert "線形代数" in prompt
        assert "33.3" in prompt
        assert result == "トピック別分析結果"


@pytest.mark.asyncio
async def test_generate_ai_analysis_without_topic_scores() -> None:
    """topic_scores未指定でも後方互換で動作すること"""
    category_scores = {
        "応用数学": {"total": 10, "correct": 7, "accuracy": 70.0, "grade": "B"},
    }
    with patch(
        "app.services.mock_exam_ai_analysis.call_anthropic_api",
        new_callable=AsyncMock,
        return_value="結果",
    ) as mock_api:
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores=category_scores,
        )
        mock_api.assert_called_once()
        assert result == "結果"


@pytest.mark.asyncio
async def test_generate_ai_analysis_failure() -> None:
    """API失敗時にNoneを返すこと"""
    with patch(
        "app.services.mock_exam_ai_analysis.call_anthropic_api",
        new_callable=AsyncMock,
        side_effect=Exception("API error"),
    ):
        result = await generate_ai_analysis(
            score=70.0, correct_count=70, total=100,
            passed=True, category_scores={},
        )
        assert result is None
