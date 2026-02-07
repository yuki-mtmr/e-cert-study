"""解説再生成サービスのテスト"""
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.explanation_generator import (
    EXPLANATION_PROMPT,
    generate_explanation,
    generate_explanations_batch,
    is_already_formatted,
)


class TestExplanationPrompt:
    """EXPLANATION_PROMPTの内容検証"""

    def test_prompt_contains_markdown_section_headers(self) -> None:
        """プロンプトに明示的なMarkdownセクションヘッダー指示が含まれている"""
        assert "### 正解を導く手順" in EXPLANATION_PROMPT
        assert "### 選択肢の比較" in EXPLANATION_PROMPT
        assert "### 覚え方のコツ" in EXPLANATION_PROMPT

    def test_prompt_contains_question_placeholder(self) -> None:
        """プロンプトに問題文プレースホルダが含まれている"""
        assert "{content}" in EXPLANATION_PROMPT

    def test_prompt_contains_choices_placeholder(self) -> None:
        """プロンプトに選択肢プレースホルダが含まれている"""
        assert "{choices_text}" in EXPLANATION_PROMPT

    def test_prompt_contains_correct_answer_placeholder(self) -> None:
        """プロンプトに正解プレースホルダが含まれている"""
        assert "{correct_answer}" in EXPLANATION_PROMPT

    def test_prompt_instructs_elimination_method(self) -> None:
        """プロンプトに消去法の指示が含まれている"""
        assert "消去法" in EXPLANATION_PROMPT

    def test_prompt_instructs_markdown_format(self) -> None:
        """プロンプトにMarkdown形式での出力指示が含まれている"""
        assert "Markdown" in EXPLANATION_PROMPT or "markdown" in EXPLANATION_PROMPT


class TestGenerateExplanation:
    """generate_explanation関数のテスト"""

    @pytest.mark.asyncio
    async def test_generate_explanation_success(self) -> None:
        """正常に解説を生成できる"""
        mock_explanation = """### 正解を導く手順
1. 活性化関数の役割を考える
2. 非線形性が必要な理由を理解する

### 選択肢の比較
- A. 入力データの正規化: これはバッチ正規化の役割
- B. 非線形性の導入: 正解。活性化関数の主な役割
- C. 損失関数の計算: 損失関数は別のコンポーネント
- D. 勾配の計算: これは逆伝播の役割

### 覚え方のコツ
「活性化 = 非線形」と覚えましょう。"""

        with patch(
            "app.services.explanation_generator.call_claude_cli",
            new_callable=AsyncMock,
        ) as mock_cli:
            mock_cli.return_value = mock_explanation

            result = await generate_explanation(
                content="活性化関数の役割は何か？",
                choices=["入力データの正規化", "非線形性の導入", "損失関数の計算", "勾配の計算"],
                correct_answer=1,
            )

            assert "正解を導く手順" in result
            assert "選択肢の比較" in result
            mock_cli.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_explanation_passes_correct_prompt(self) -> None:
        """正しいプロンプトがCLIに渡される"""
        with patch(
            "app.services.explanation_generator.call_claude_cli",
            new_callable=AsyncMock,
        ) as mock_cli:
            mock_cli.return_value = "解説テキスト"

            await generate_explanation(
                content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
            )

            call_args = mock_cli.call_args[0][0]
            assert "テスト問題" in call_args
            assert "A" in call_args
            assert "B" in call_args
            assert "正解: A" in call_args

    @pytest.mark.asyncio
    async def test_generate_explanation_cli_error(self) -> None:
        """CLI呼び出しエラー時に例外が発生する"""
        with patch(
            "app.services.explanation_generator.call_claude_cli",
            new_callable=AsyncMock,
        ) as mock_cli:
            mock_cli.side_effect = Exception("CLI Error")

            with pytest.raises(Exception, match="CLI Error"):
                await generate_explanation(
                    content="テスト問題",
                    choices=["A", "B", "C", "D"],
                    correct_answer=0,
                )

    @pytest.mark.asyncio
    async def test_generate_explanation_empty_content_raises_error(self) -> None:
        """空の問題文はエラー"""
        with pytest.raises(ValueError, match="問題文"):
            await generate_explanation(
                content="",
                choices=["A", "B", "C", "D"],
                correct_answer=0,
            )

    @pytest.mark.asyncio
    async def test_generate_explanation_invalid_correct_answer_raises_error(self) -> None:
        """正解インデックスが範囲外の場合はエラー"""
        with pytest.raises(ValueError, match="正解インデックス"):
            await generate_explanation(
                content="テスト問題",
                choices=["A", "B", "C", "D"],
                correct_answer=5,
            )


class TestIsAlreadyFormatted:
    """is_already_formatted関数のテスト"""

    def test_formatted_explanation_returns_true(self) -> None:
        """新フォーマットの解説はTrueを返す"""
        explanation = """### 正解を導く手順
1. まず活性化関数の役割を考える

### 選択肢の比較
- A. 入力データの正規化: バッチ正規化の役割

### 覚え方のコツ
「活性化 = 非線形」と覚えましょう。"""
        assert is_already_formatted(explanation) is True

    def test_partial_format_returns_true(self) -> None:
        """### 正解を導く手順が含まれていればTrueを返す"""
        explanation = "### 正解を導く手順\nステップ1..."
        assert is_already_formatted(explanation) is True

    def test_old_format_returns_false(self) -> None:
        """旧フォーマットの解説はFalseを返す"""
        explanation = "この問題の正解はBです。活性化関数は非線形性を導入します。"
        assert is_already_formatted(explanation) is False

    def test_empty_string_returns_false(self) -> None:
        """空文字列はFalseを返す"""
        assert is_already_formatted("") is False

    def test_none_returns_false(self) -> None:
        """NoneはFalseを返す"""
        assert is_already_formatted(None) is False

    def test_whitespace_only_returns_false(self) -> None:
        """空白のみはFalseを返す"""
        assert is_already_formatted("   \n\t  ") is False


class TestGenerateExplanationsBatch:
    """generate_explanations_batch関数のテスト"""

    def _make_question(
        self,
        question_id: str = "q1",
        content: str = "テスト問題",
        choices: list[str] | None = None,
        correct_answer: int = 0,
        explanation: str = "古い解説",
    ) -> MagicMock:
        """テスト用Question風オブジェクトを作成"""
        q = MagicMock()
        q.id = question_id
        q.content = content
        q.choices = choices or ["A", "B", "C", "D"]
        q.correct_answer = correct_answer
        q.explanation = explanation
        return q

    @pytest.mark.asyncio
    async def test_batch_generates_all_explanations(self) -> None:
        """全問題の解説を生成する"""
        questions = [self._make_question(f"q{i}") for i in range(3)]

        with patch(
            "app.services.explanation_generator.generate_explanation",
            new_callable=AsyncMock,
            return_value="### 正解を導く手順\n新しい解説",
        ):
            results = await generate_explanations_batch(questions, concurrency=3)

        assert len(results) == 3
        for r in results:
            assert r["status"] == "success"
            assert r["explanation"] == "### 正解を導く手順\n新しい解説"

    @pytest.mark.asyncio
    async def test_batch_respects_concurrency(self) -> None:
        """セマフォで並列度が制御される"""
        import asyncio

        max_concurrent = 0
        current_concurrent = 0
        lock = asyncio.Lock()

        async def mock_generate(content: str, choices: list, correct_answer: int) -> str:
            nonlocal max_concurrent, current_concurrent
            async with lock:
                current_concurrent += 1
                if current_concurrent > max_concurrent:
                    max_concurrent = current_concurrent
            await asyncio.sleep(0.05)
            async with lock:
                current_concurrent -= 1
            return "### 正解を導く手順\n解説"

        questions = [self._make_question(f"q{i}") for i in range(6)]

        with patch(
            "app.services.explanation_generator.generate_explanation",
            side_effect=mock_generate,
        ):
            await generate_explanations_batch(questions, concurrency=2)

        # 最大同時実行数が2以下であること
        assert max_concurrent <= 2

    @pytest.mark.asyncio
    async def test_batch_handles_partial_failure(self) -> None:
        """一部失敗しても他の問題は成功する"""
        questions = [self._make_question(f"q{i}") for i in range(3)]

        call_count = 0

        async def mock_generate(content: str, choices: list, correct_answer: int) -> str:
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise Exception("CLI Error")
            return "### 正解を導く手順\n解説"

        with patch(
            "app.services.explanation_generator.generate_explanation",
            side_effect=mock_generate,
        ):
            results = await generate_explanations_batch(questions, concurrency=3)

        success_count = sum(1 for r in results if r["status"] == "success")
        error_count = sum(1 for r in results if r["status"] == "error")
        assert success_count == 2
        assert error_count == 1

    @pytest.mark.asyncio
    async def test_batch_returns_correct_structure(self) -> None:
        """結果dictの構造が正しい"""
        questions = [self._make_question("q1")]

        with patch(
            "app.services.explanation_generator.generate_explanation",
            new_callable=AsyncMock,
            return_value="### 正解を導く手順\n解説",
        ):
            results = await generate_explanations_batch(questions, concurrency=1)

        assert len(results) == 1
        r = results[0]
        assert "question_id" in r
        assert "explanation" in r
        assert "status" in r
        assert r["question_id"] == "q1"

    @pytest.mark.asyncio
    async def test_batch_error_result_contains_error_field(self) -> None:
        """エラー時にerrorフィールドが含まれる"""
        questions = [self._make_question("q1")]

        with patch(
            "app.services.explanation_generator.generate_explanation",
            new_callable=AsyncMock,
            side_effect=Exception("生成失敗"),
        ):
            results = await generate_explanations_batch(questions, concurrency=1)

        assert results[0]["status"] == "error"
        assert "生成失敗" in results[0]["error"]
        assert results[0]["explanation"] is None

    @pytest.mark.asyncio
    async def test_batch_logs_progress(self, caplog: pytest.LogCaptureFixture) -> None:
        """進捗ログが出力される"""
        questions = [self._make_question(f"q{i}") for i in range(3)]

        with patch(
            "app.services.explanation_generator.generate_explanation",
            new_callable=AsyncMock,
            return_value="### 正解を導く手順\n解説",
        ):
            with caplog.at_level(logging.INFO, logger="app.services.explanation_generator"):
                await generate_explanations_batch(questions, concurrency=3)

        log_messages = caplog.text
        assert "Processing" in log_messages
        assert "/3" in log_messages

    @pytest.mark.asyncio
    async def test_batch_empty_questions(self) -> None:
        """空リストの場合は空リストを返す"""
        results = await generate_explanations_batch([], concurrency=3)
        assert results == []
