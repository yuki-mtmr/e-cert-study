"""トピックラベリングスクリプトのテスト"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scripts.label_topics import estimate_topic, build_batch_prompt, parse_batch_response


class TestEstimateTopic:
    """単一問題のトピック推定テスト"""

    @pytest.mark.asyncio
    async def test_estimate_topic_returns_string(self) -> None:
        """APIからトピック名が返ること"""
        with patch(
            "scripts.label_topics.call_anthropic_api",
            new_callable=AsyncMock,
            return_value="ベイズ則",
        ):
            result = await estimate_topic(
                content="ベイズの定理を用いて事後確率を求めよ",
                category_name="確率・統計",
            )
            assert result == "ベイズ則"

    @pytest.mark.asyncio
    async def test_estimate_topic_strips_whitespace(self) -> None:
        """前後の空白がトリムされること"""
        with patch(
            "scripts.label_topics.call_anthropic_api",
            new_callable=AsyncMock,
            return_value="  バッチ正規化  \n",
        ):
            result = await estimate_topic(
                content="バッチ正規化について",
                category_name="CNN",
            )
            assert result == "バッチ正規化"


class TestBuildBatchPrompt:
    """バッチプロンプト構築テスト"""

    def test_builds_prompt_with_questions(self) -> None:
        """複数問題を含むプロンプトが構築されること"""
        questions = [
            {"id": "q1", "content": "ベイズの定理について", "category_name": "確率・統計"},
            {"id": "q2", "content": "CNNのプーリング層について", "category_name": "CNN"},
        ]
        prompt = build_batch_prompt(questions)
        assert "q1" in prompt
        assert "q2" in prompt
        assert "ベイズの定理" in prompt
        assert "CNN" in prompt
        assert "JSON" in prompt


class TestParseBatchResponse:
    """バッチレスポンスのパーステスト"""

    def test_parse_valid_json(self) -> None:
        """正しいJSONをパースできること"""
        response = '{"q1": "ベイズ則", "q2": "プーリング"}'
        result = parse_batch_response(response)
        assert result == {"q1": "ベイズ則", "q2": "プーリング"}

    def test_parse_json_in_code_block(self) -> None:
        """コードブロック内のJSONをパースできること"""
        response = '```json\n{"q1": "ベイズ則"}\n```'
        result = parse_batch_response(response)
        assert result == {"q1": "ベイズ則"}

    def test_parse_invalid_json_returns_empty(self) -> None:
        """不正なJSONの場合は空辞書を返すこと"""
        result = parse_batch_response("invalid json")
        assert result == {}
