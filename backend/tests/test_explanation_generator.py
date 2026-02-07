"""解説再生成サービスのテスト"""
from unittest.mock import AsyncMock, patch

import pytest

from app.services.explanation_generator import (
    EXPLANATION_PROMPT,
    generate_explanation,
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
