"""PDF問題抽出サービスのテスト"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.pdf_extractor import (
    call_claude_cli,
    extract_questions_from_text,
    extract_text_from_pdf,
    parse_llm_response,
    PDFExtractionError,
)


class TestCallClaudeCli:
    """Claude CLI呼び出しのテスト"""

    @pytest.mark.asyncio
    async def test_call_claude_cli_success(self) -> None:
        """Claude CLIが正常に呼び出される"""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b'[{"content": "test"}]', b'')

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            result = await call_claude_cli("test prompt")
            assert result == '[{"content": "test"}]'

    @pytest.mark.asyncio
    async def test_call_claude_cli_error(self) -> None:
        """Claude CLIエラー時に例外を投げる"""
        mock_process = AsyncMock()
        mock_process.returncode = 1
        mock_process.communicate.return_value = (b'', b'error message')

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            with pytest.raises(PDFExtractionError) as exc_info:
                await call_claude_cli("test prompt")
            assert "Claude CLI error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_call_claude_cli_calls_with_correct_args(self) -> None:
        """Claude CLIが正しい引数で呼び出される"""
        mock_process = AsyncMock()
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b'result', b'')

        with patch("asyncio.create_subprocess_exec", return_value=mock_process) as mock_exec:
            await call_claude_cli("my prompt")
            mock_exec.assert_called_once()
            args = mock_exec.call_args[0]
            assert args[0] == "claude"
            assert args[1] == "-p"
            assert args[2] == "my prompt"


class TestParseLlmResponse:
    """LLMレスポンスのパースのテスト"""

    def test_parse_valid_json_response(self) -> None:
        """正しいJSON形式のレスポンスをパースできる"""
        response = """
        [
            {
                "content": "バックプロパゲーションとは何か？",
                "choices": ["順伝播", "逆伝播", "勾配降下", "正規化"],
                "correct_answer": 1,
                "explanation": "バックプロパゲーションは誤差逆伝播法です。",
                "difficulty": 3
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content"] == "バックプロパゲーションとは何か？"
        assert result[0]["correct_answer"] == 1

    def test_parse_response_with_markdown_code_block(self) -> None:
        """Markdownコードブロック付きレスポンスをパースできる"""
        response = """
        ```json
        [
            {
                "content": "CNNとは何の略か？",
                "choices": ["Convolutional Neural Network", "Connected Neural Network", "Computed Neural Network", "Central Neural Network"],
                "correct_answer": 0,
                "explanation": "CNNはConvolutional Neural Networkの略です。",
                "difficulty": 2
            }
        ]
        ```
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert "CNN" in result[0]["content"]

    def test_parse_empty_response_raises_error(self) -> None:
        """空のレスポンスはエラー"""
        with pytest.raises(PDFExtractionError):
            parse_llm_response("")

    def test_parse_invalid_json_raises_error(self) -> None:
        """無効なJSONはエラー"""
        with pytest.raises(PDFExtractionError):
            parse_llm_response("This is not JSON")

    def test_parse_response_validates_required_fields(self) -> None:
        """必須フィールドがない場合は除外"""
        response = """
        [
            {
                "content": "完全な問題",
                "choices": ["A", "B", "C", "D"],
                "correct_answer": 0,
                "explanation": "解説",
                "difficulty": 3
            },
            {
                "content": "選択肢なし問題"
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content"] == "完全な問題"


class TestExtractQuestionsFromText:
    """テキストからの問題抽出のテスト（Claude CLI使用）"""

    @pytest.mark.asyncio
    async def test_extract_questions_success(self) -> None:
        """正常に問題を抽出できる"""
        mock_response = """
        [
            {
                "content": "深層学習とは何か？",
                "choices": ["機械学習の一種", "統計分析", "データ前処理", "可視化技術"],
                "correct_answer": 0,
                "explanation": "深層学習は多層ニューラルネットワークを用いた機械学習の一種です。",
                "difficulty": 2
            }
        ]
        """

        with patch("app.services.pdf_extractor.call_claude_cli", new_callable=AsyncMock) as mock_cli:
            mock_cli.return_value = mock_response

            result = await extract_questions_from_text(
                "深層学習についての説明テキスト",
                source="テスト教材",
            )

            assert len(result) == 1
            assert result[0]["content"] == "深層学習とは何か？"
            assert result[0]["source"] == "テスト教材"

    @pytest.mark.asyncio
    async def test_extract_questions_empty_text(self) -> None:
        """空のテキストはエラー"""
        with pytest.raises(PDFExtractionError):
            await extract_questions_from_text("", source="test")

    @pytest.mark.asyncio
    async def test_extract_questions_cli_error(self) -> None:
        """Claude CLI呼び出しエラーをハンドリング"""
        with patch("app.services.pdf_extractor.call_claude_cli", new_callable=AsyncMock) as mock_cli:
            mock_cli.side_effect = PDFExtractionError("CLI Error")

            with pytest.raises(PDFExtractionError) as exc_info:
                await extract_questions_from_text("テスト", source="test")

            assert "CLI Error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_questions_with_category(self) -> None:
        """カテゴリIDを設定できる"""
        mock_response = """
        [
            {
                "content": "テスト問題",
                "choices": ["A", "B", "C", "D"],
                "correct_answer": 0,
                "explanation": "解説",
                "difficulty": 1
            }
        ]
        """

        with patch("app.services.pdf_extractor.call_claude_cli", new_callable=AsyncMock) as mock_cli:
            mock_cli.return_value = mock_response

            category_id = uuid.uuid4()
            result = await extract_questions_from_text(
                "テキスト",
                source="test",
                category_id=category_id,
            )

            assert result[0]["category_id"] == category_id

    @pytest.mark.asyncio
    async def test_extract_questions_unexpected_error(self) -> None:
        """予期しないエラーをPDFExtractionErrorでラップ"""
        with patch("app.services.pdf_extractor.call_claude_cli", new_callable=AsyncMock) as mock_cli:
            mock_cli.side_effect = RuntimeError("Unexpected error")

            with pytest.raises(PDFExtractionError) as exc_info:
                await extract_questions_from_text("テスト", source="test")

            assert "Unexpected error" in str(exc_info.value)


class TestParseLlmResponseEdgeCases:
    """LLMレスポンスパースの追加テスト"""

    def test_parse_non_array_json_raises_error(self) -> None:
        """JSONオブジェクト（配列ではない）はエラー"""
        response = '{"content": "test"}'
        with pytest.raises(PDFExtractionError) as exc_info:
            parse_llm_response(response)
        assert "not a JSON array" in str(exc_info.value)

    def test_parse_response_with_preamble_text(self) -> None:
        """説明文付きのレスポンスをパースできる"""
        response = '''以下のテキストからE資格の試験問題を作成しました：

```json
[
    {
        "content": "テスト問題",
        "choices": ["A", "B", "C", "D"],
        "correct_answer": 0,
        "explanation": "解説",
        "difficulty": 2
    }
]
```'''
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content"] == "テスト問題"

    def test_parse_response_with_preamble_and_postamble(self) -> None:
        """説明文と後文付きのレスポンスをパースできる"""
        response = '''以下のテキストから問題を抽出しました。

```json
[
    {
        "content": "バッチ正規化とは何か？",
        "choices": ["正規化手法", "最適化手法", "損失関数", "活性化関数"],
        "correct_answer": 0,
        "explanation": "バッチ正規化は学習を安定させる正規化手法です。",
        "difficulty": 3
    }
]
```

上記の問題はテキストの内容に基づいています。'''
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content"] == "バッチ正規化とは何か？"

    def test_parse_response_direct_array_with_preamble(self) -> None:
        """コードブロックなしの直接配列（説明文付き）をパースできる"""
        response = '''問題を抽出しました：

[
    {
        "content": "勾配消失問題とは？",
        "choices": ["勾配が小さくなる", "勾配が大きくなる", "勾配が負になる", "勾配が正になる"],
        "correct_answer": 0,
        "explanation": "深い層で勾配が小さくなりすぎる問題です。",
        "difficulty": 3
    }
]'''
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content"] == "勾配消失問題とは？"


class TestExtractTextFromPdf:
    """PDFテキスト抽出のテスト"""

    @pytest.mark.asyncio
    async def test_extract_text_from_valid_pdf(self) -> None:
        """正常なPDFからテキストを抽出できる"""
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Page 1 content"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert result == "Page 1 content"

    @pytest.mark.asyncio
    async def test_extract_text_from_multi_page_pdf(self) -> None:
        """複数ページのPDFからテキストを抽出できる"""
        mock_page1 = MagicMock()
        mock_page1.extract_text.return_value = "Page 1"

        mock_page2 = MagicMock()
        mock_page2.extract_text.return_value = "Page 2"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert result == "Page 1\nPage 2"

    @pytest.mark.asyncio
    async def test_extract_text_skips_empty_pages(self) -> None:
        """空のページはスキップされる"""
        mock_page1 = MagicMock()
        mock_page1.extract_text.return_value = "Page 1"

        mock_page2 = MagicMock()
        mock_page2.extract_text.return_value = None

        mock_page3 = MagicMock()
        mock_page3.extract_text.return_value = "Page 3"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2, mock_page3]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert result == "Page 1\nPage 3"

    @pytest.mark.asyncio
    async def test_extract_text_from_invalid_pdf_raises_error(self) -> None:
        """不正なPDFはエラー"""
        with patch("pypdf.PdfReader", side_effect=Exception("Invalid PDF")):
            with pytest.raises(PDFExtractionError) as exc_info:
                await extract_text_from_pdf(b"invalid content")
            assert "Failed to extract text from PDF" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_text_continues_on_page_error(self) -> None:
        """ページ抽出エラーが発生しても他のページの処理を継続する"""
        mock_page1 = MagicMock()
        mock_page1.extract_text.return_value = "Page 1 content"

        mock_page2 = MagicMock()
        mock_page2.extract_text.side_effect = Exception("XFormObject decode error")

        mock_page3 = MagicMock()
        mock_page3.extract_text.return_value = "Page 3 content"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2, mock_page3]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert "Page 1 content" in result
            assert "Page 3 content" in result

    @pytest.mark.asyncio
    async def test_extract_text_returns_partial_result_on_error(self) -> None:
        """一部ページがエラーでも抽出できたテキストを返す"""
        mock_page1 = MagicMock()
        mock_page1.extract_text.side_effect = Exception("impossible to decode XFormObject")

        mock_page2 = MagicMock()
        mock_page2.extract_text.return_value = "Valid content from page 2"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert result == "Valid content from page 2"

    @pytest.mark.asyncio
    async def test_extract_text_raises_error_when_all_pages_fail(self) -> None:
        """全ページがエラーの場合はPDFExtractionErrorを投げる"""
        mock_page1 = MagicMock()
        mock_page1.extract_text.side_effect = Exception("XFormObject error")

        mock_page2 = MagicMock()
        mock_page2.extract_text.side_effect = Exception("Another error")

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2]

        with patch("pypdf.PdfReader", return_value=mock_reader):
            with pytest.raises(PDFExtractionError) as exc_info:
                await extract_text_from_pdf(b"fake pdf content")
            assert "No text could be extracted" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_text_handles_page_iteration_error(self) -> None:
        """reader.pagesのイテレーション時のエラーをハンドリングする"""
        mock_reader = MagicMock()
        # pagesプロパティへのアクセス自体がエラーを投げるケース
        type(mock_reader).pages = property(
            lambda self: (_ for _ in ()).throw(Exception("impossible to decode XFormObject"))
        )

        with patch("pypdf.PdfReader", return_value=mock_reader):
            with pytest.raises(PDFExtractionError) as exc_info:
                await extract_text_from_pdf(b"fake pdf content")
            assert "Failed to extract text from PDF" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_extract_text_handles_page_access_by_index_error(self) -> None:
        """インデックスによるページアクセス時のエラーをハンドリングする"""
        mock_page0 = MagicMock()
        mock_page0.extract_text.return_value = "Page 1 content"

        mock_page2 = MagicMock()
        mock_page2.extract_text.return_value = "Page 3 content"

        # ページ0は成功、ページ1はエラー、ページ2は成功
        def mock_getitem(index: int) -> MagicMock:
            if index == 0:
                return mock_page0
            if index == 1:
                raise Exception("impossible to decode XFormObject")
            if index == 2:
                return mock_page2
            raise IndexError(f"Index {index} out of range")

        mock_pages = MagicMock()
        mock_pages.__len__ = MagicMock(return_value=3)
        mock_pages.__getitem__ = MagicMock(side_effect=mock_getitem)

        mock_reader = MagicMock()
        mock_reader.pages = mock_pages

        with patch("pypdf.PdfReader", return_value=mock_reader):
            result = await extract_text_from_pdf(b"fake pdf content")
            assert "Page 1 content" in result
            assert "Page 3 content" in result


class TestExtractTextFromPdfLogging:
    """PDFテキスト抽出の診断ログのテスト"""

    @pytest.mark.asyncio
    async def test_extract_text_suppresses_pypdf_warnings(self, caplog: pytest.LogCaptureFixture) -> None:
        """pypdfの警告（Skipping broken line等）が抑制される"""
        import logging

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Page content"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]

        # pypdfのロガーからの警告をキャプチャ
        with caplog.at_level(logging.WARNING, logger="pypdf"):
            with patch("pypdf.PdfReader", return_value=mock_reader):
                await extract_text_from_pdf(b"fake pdf content")

        # pypdfからの警告が出力されていないことを確認
        pypdf_warnings = [r for r in caplog.records if r.name.startswith("pypdf")]
        assert len(pypdf_warnings) == 0

    @pytest.mark.asyncio
    async def test_extract_text_logs_total_pages(self, caplog: pytest.LogCaptureFixture) -> None:
        """総ページ数がログに記録される"""
        import logging

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Page content"

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page, mock_page, mock_page]

        with caplog.at_level(logging.INFO):
            with patch("pypdf.PdfReader", return_value=mock_reader):
                await extract_text_from_pdf(b"fake pdf content")

        assert "Processing PDF with 3 pages" in caplog.text

    @pytest.mark.asyncio
    async def test_extract_text_logs_extraction_summary(self, caplog: pytest.LogCaptureFixture) -> None:
        """抽出結果サマリーがログに記録される"""
        import logging

        mock_page1 = MagicMock()
        mock_page1.extract_text.return_value = "Page 1 content"

        mock_page2 = MagicMock()
        mock_page2.extract_text.return_value = None  # 空ページ

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page1, mock_page2]

        with caplog.at_level(logging.INFO):
            with patch("pypdf.PdfReader", return_value=mock_reader):
                await extract_text_from_pdf(b"fake pdf content")

        # 2ページ中1ページからテキストを抽出したことがログに記録される
        assert "Extracted" in caplog.text
        assert "1/2 pages" in caplog.text

    @pytest.mark.asyncio
    async def test_extract_text_logs_page_details_at_debug_level(self, caplog: pytest.LogCaptureFixture) -> None:
        """ページごとの詳細がDEBUGレベルでログに記録される"""
        import logging

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "A" * 100

        mock_reader = MagicMock()
        mock_reader.pages = [mock_page]

        with caplog.at_level(logging.DEBUG, logger="app.services.pdf_extractor"):
            with patch("pypdf.PdfReader", return_value=mock_reader):
                await extract_text_from_pdf(b"fake pdf content")

        assert "Page 1: extracted 100 chars" in caplog.text


class TestContentTypeDetection:
    """content_type検出のテスト"""

    def test_parse_response_with_content_type_markdown(self) -> None:
        """content_type: markdownを含むレスポンスをパースできる"""
        response = """
        [
            {
                "content": "以下のコードの出力は？\\n```python\\nprint('hello')\\n```",
                "choices": ["hello", "Hello", "HELLO", "error"],
                "correct_answer": 0,
                "explanation": "print関数は引数をそのまま出力します。",
                "difficulty": 2,
                "content_type": "markdown"
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content_type"] == "markdown"

    def test_parse_response_with_content_type_code(self) -> None:
        """content_type: codeを含むレスポンスをパースできる"""
        response = """
        [
            {
                "content": "def foo():\\n    return 1",
                "choices": ["1", "None", "error", "0"],
                "correct_answer": 0,
                "explanation": "関数fooは1を返します。",
                "difficulty": 2,
                "content_type": "code"
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content_type"] == "code"

    def test_parse_response_with_content_type_plain(self) -> None:
        """content_type: plainを含むレスポンスをパースできる"""
        response = """
        [
            {
                "content": "バックプロパゲーションとは何か？",
                "choices": ["順伝播", "逆伝播", "勾配降下", "正規化"],
                "correct_answer": 1,
                "explanation": "誤差逆伝播法です。",
                "difficulty": 3,
                "content_type": "plain"
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert result[0]["content_type"] == "plain"

    def test_parse_response_without_content_type_defaults_to_plain(self) -> None:
        """content_typeがない場合はplainとして扱われる（フロントエンドでデフォルト処理）"""
        response = """
        [
            {
                "content": "テスト問題",
                "choices": ["A", "B", "C", "D"],
                "correct_answer": 0,
                "explanation": "解説",
                "difficulty": 2
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        # content_typeがない場合もパースは成功する（フロントエンドでplainとして処理）
        assert "content_type" not in result[0] or result[0].get("content_type") == "plain"


class TestParseLlmResponseLogging:
    """LLMレスポンスパースの診断ログのテスト"""

    def test_parse_llm_response_logs_empty_response(self, caplog: pytest.LogCaptureFixture) -> None:
        """空のレスポンス時にエラーがログに記録される"""
        import logging

        with caplog.at_level(logging.ERROR):
            with pytest.raises(PDFExtractionError):
                parse_llm_response("")

        assert "Empty response from LLM" in caplog.text

    def test_parse_llm_response_logs_json_parse_failure(self, caplog: pytest.LogCaptureFixture) -> None:
        """JSONパース失敗時にレスポンスプレビューがログに記録される"""
        import logging

        with caplog.at_level(logging.ERROR):
            with pytest.raises(PDFExtractionError):
                parse_llm_response("This is not valid JSON")

        assert "JSON parse failed" in caplog.text
        assert "Response preview:" in caplog.text

    def test_parse_llm_response_logs_truncated_preview_for_long_response(self, caplog: pytest.LogCaptureFixture) -> None:
        """長いレスポンスのプレビューが切り詰められる"""
        import logging

        long_response = "x" * 1000  # 500文字より長いレスポンス

        with caplog.at_level(logging.ERROR):
            with pytest.raises(PDFExtractionError):
                parse_llm_response(long_response)

        # プレビューは500文字以下に切り詰められる
        assert "JSON parse failed" in caplog.text
        # ログにはx * 500 が含まれるが、x * 1000 全体は含まれない
        logged_preview = [r for r in caplog.records if "Response preview:" in r.message][0].message
        preview_content = logged_preview.split("Response preview:")[1].strip()
        assert len(preview_content) <= 500


class TestExplanationQuality:
    """解説の品質向上に関するテスト"""

    def test_extraction_prompt_contains_choice_comparison_instruction(self) -> None:
        """EXTRACTION_PROMPTに選択肢比較の指示が含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 選択肢の違いを比較する指示が含まれている
        assert "選択肢" in EXTRACTION_PROMPT
        assert "比較" in EXTRACTION_PROMPT or "差" in EXTRACTION_PROMPT

    def test_extraction_prompt_contains_derivation_steps_instruction(self) -> None:
        """EXTRACTION_PROMPTに正解導出手順の指示が含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 正解を導く手順・消去法の指示が含まれている
        assert "消去法" in EXTRACTION_PROMPT or "導" in EXTRACTION_PROMPT

    def test_extraction_prompt_contains_memorization_tips_instruction(self) -> None:
        """EXTRACTION_PROMPTに覚え方のコツの指示が含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 覚え方のコツ・ゴロ合わせの指示が含まれている
        assert "覚え方" in EXTRACTION_PROMPT or "ゴロ合わせ" in EXTRACTION_PROMPT or "コツ" in EXTRACTION_PROMPT

    def test_extraction_prompt_contains_math_formula_guidance(self) -> None:
        """EXTRACTION_PROMPTに数式問題のガイダンスが含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 数式問題での記号反転パターン指摘の指示が含まれている
        assert "数式" in EXTRACTION_PROMPT
        assert "記号" in EXTRACTION_PROMPT or "反転" in EXTRACTION_PROMPT or "転置" in EXTRACTION_PROMPT

    def test_extraction_prompt_contains_wrong_answer_explanation_instruction(self) -> None:
        """EXTRACTION_PROMPTに不正解選択肢の説明指示が含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 不正解の選択肢がなぜ間違いかの説明指示が含まれている
        assert "不正解" in EXTRACTION_PROMPT or "間違い" in EXTRACTION_PROMPT or "誤り" in EXTRACTION_PROMPT

    def test_extraction_prompt_contains_explicit_markdown_section_headers(self) -> None:
        """EXTRACTION_PROMPTに明示的なMarkdownセクションヘッダーが含まれている"""
        from app.services.pdf_extractor import EXTRACTION_PROMPT

        # 解説の出力形式として明示的なMarkdownセクションヘッダーが指定されている
        assert "### 正解を導く手順" in EXTRACTION_PROMPT
        assert "### 選択肢の比較" in EXTRACTION_PROMPT
        assert "### 覚え方のコツ" in EXTRACTION_PROMPT

    def test_parse_response_with_detailed_explanation(self) -> None:
        """詳細な解説を含むレスポンスをパースできる"""
        response = """
        [
            {
                "content": "勾配降下法の更新式として正しいものはどれか？",
                "choices": ["θ = θ + α∇L", "θ = θ - α∇L", "θ = θ × α∇L", "θ = θ ÷ α∇L"],
                "correct_answer": 1,
                "explanation": "## 正解導出の手順\\n\\n1. 勾配降下法は損失関数を最小化する手法\\n2. 最小化するためには勾配の**逆方向**に進む必要がある\\n3. したがって「マイナス」が正解\\n\\n## 選択肢の比較\\n\\n- 選択肢1（+α∇L）: 勾配方向に進むため損失が増加する\\n- 選択肢2（-α∇L）: 勾配の逆方向に進むため損失が減少する（正解）\\n- 選択肢3（×α∇L）: 更新式として意味をなさない\\n- 選択肢4（÷α∇L）: 更新式として意味をなさない\\n\\n## 覚え方のコツ\\n\\n「勾配降下はマイナス方向」と覚えましょう。",
                "difficulty": 3,
                "content_type": "markdown"
            }
        ]
        """
        result = parse_llm_response(response)
        assert len(result) == 1
        assert "正解導出" in result[0]["explanation"] or "手順" in result[0]["explanation"]
        assert "選択肢" in result[0]["explanation"]
        assert "覚え方" in result[0]["explanation"] or "コツ" in result[0]["explanation"]
