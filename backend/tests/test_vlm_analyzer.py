"""VLM Analyzer サービスのテスト

LLaVA via Ollamaを使った画像解析サービスのテスト
"""
import base64
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.services.vlm_analyzer import (
    VLMAnalyzer,
    VLMAnalysisResult,
    VLMConnectionError,
    VLMTimeoutError,
    analyze_image,
)


# テスト用の小さなPNG画像（1x1ピクセル、透明）
TEST_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
TEST_PNG_BYTES = base64.b64decode(TEST_PNG_BASE64)


class TestVLMAnalyzer:
    """VLMAnalyzerクラスのテスト"""

    def test_analyzer_initialization(self):
        """アナライザーの初期化テスト"""
        analyzer = VLMAnalyzer()
        assert analyzer.base_url == "http://localhost:11434"
        assert analyzer.model == "llava:7b"
        assert analyzer.timeout == 30

    def test_analyzer_custom_config(self):
        """カスタム設定での初期化テスト"""
        analyzer = VLMAnalyzer(
            base_url="http://custom:11434",
            model="custom-model",
            timeout=60,
        )
        assert analyzer.base_url == "http://custom:11434"
        assert analyzer.model == "custom-model"
        assert analyzer.timeout == 60

    @pytest.mark.asyncio
    async def test_analyze_image_success(self):
        """画像解析成功のテスト"""
        analyzer = VLMAnalyzer()

        mock_response = {
            "model": "llava:7b",
            "response": "This is a neural network architecture diagram showing...",
            "done": True,
        }

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_response

            result = await analyzer.analyze(
                image_data=TEST_PNG_BYTES,
                prompt="Describe this image",
            )

            assert isinstance(result, VLMAnalysisResult)
            assert result.description == mock_response["response"]
            assert result.model == "llava:7b"
            mock_call.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_image_with_base64(self):
        """Base64エンコード画像の解析テスト"""
        analyzer = VLMAnalyzer()

        mock_response = {
            "model": "llava:7b",
            "response": "A mathematical formula showing...",
            "done": True,
        }

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_response

            result = await analyzer.analyze_base64(
                image_base64=TEST_PNG_BASE64,
                prompt="Describe this formula",
            )

            assert isinstance(result, VLMAnalysisResult)
            assert result.description == mock_response["response"]

    @pytest.mark.asyncio
    async def test_analyze_image_timeout(self):
        """タイムアウト時のテスト"""
        analyzer = VLMAnalyzer(timeout=1)

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            import asyncio
            mock_call.side_effect = asyncio.TimeoutError()

            with pytest.raises(VLMTimeoutError) as exc_info:
                await analyzer.analyze(
                    image_data=TEST_PNG_BYTES,
                    prompt="Describe this image",
                )

            assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_analyze_image_connection_error(self):
        """接続エラー時のテスト"""
        analyzer = VLMAnalyzer()

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.side_effect = ConnectionError("Cannot connect to Ollama")

            with pytest.raises(VLMConnectionError) as exc_info:
                await analyzer.analyze(
                    image_data=TEST_PNG_BYTES,
                    prompt="Describe this image",
                )

            assert "connection" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_analyze_returns_none_on_failure_with_fallback(self):
        """フォールバックモードで失敗時にNoneを返すテスト"""
        analyzer = VLMAnalyzer()

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.side_effect = ConnectionError("Cannot connect")

            result = await analyzer.analyze(
                image_data=TEST_PNG_BYTES,
                prompt="Describe this image",
                fallback_on_error=True,
            )

            assert result is None


class TestVLMAnalysisResult:
    """VLMAnalysisResultのテスト"""

    def test_result_creation(self):
        """結果オブジェクト作成のテスト"""
        result = VLMAnalysisResult(
            description="A diagram showing neural network layers",
            model="llava:7b",
            latex_content=None,
            image_type="diagram",
        )
        assert result.description == "A diagram showing neural network layers"
        assert result.model == "llava:7b"
        assert result.latex_content is None
        assert result.image_type == "diagram"

    def test_result_with_latex(self):
        """LaTeX付き結果のテスト"""
        result = VLMAnalysisResult(
            description="The quadratic formula",
            model="llava:7b",
            latex_content=r"x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}",
            image_type="formula",
        )
        assert result.latex_content is not None
        assert "frac" in result.latex_content

    def test_result_to_dict(self):
        """辞書変換のテスト"""
        result = VLMAnalysisResult(
            description="Test description",
            model="llava:7b",
            latex_content=None,
            image_type="diagram",
        )
        result_dict = result.to_dict()
        assert result_dict["description"] == "Test description"
        assert result_dict["model"] == "llava:7b"
        assert result_dict["image_type"] == "diagram"


class TestAnalyzeImageFunction:
    """analyze_image関数のテスト"""

    @pytest.mark.asyncio
    async def test_analyze_image_function(self):
        """ヘルパー関数のテスト"""
        mock_response = {
            "model": "llava:7b",
            "response": "A test image",
            "done": True,
        }

        with patch(
            "app.services.vlm_analyzer.VLMAnalyzer.analyze",
            new_callable=AsyncMock,
        ) as mock_analyze:
            mock_analyze.return_value = VLMAnalysisResult(
                description="A test image",
                model="llava:7b",
                latex_content=None,
                image_type="unknown",
            )

            result = await analyze_image(TEST_PNG_BYTES)

            assert result is not None
            assert result.description == "A test image"


class TestImageTypeDetection:
    """画像タイプ検出のテスト"""

    @pytest.mark.asyncio
    async def test_detect_diagram(self):
        """図表検出のテスト"""
        analyzer = VLMAnalyzer()

        mock_response = {
            "model": "llava:7b",
            "response": "This is a flowchart diagram showing the process flow",
            "done": True,
        }

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_response

            result = await analyzer.analyze(
                image_data=TEST_PNG_BYTES,
                detect_type=True,
            )

            assert result.image_type in ["diagram", "flowchart", "graph", "unknown"]

    @pytest.mark.asyncio
    async def test_detect_formula(self):
        """数式検出のテスト"""
        analyzer = VLMAnalyzer()

        mock_response = {
            "model": "llava:7b",
            "response": "This is a mathematical formula: E = mc^2",
            "done": True,
        }

        with patch.object(
            analyzer, "_call_ollama", new_callable=AsyncMock
        ) as mock_call:
            mock_call.return_value = mock_response

            result = await analyzer.analyze(
                image_data=TEST_PNG_BYTES,
                detect_type=True,
            )

            # 数式が検出された場合のLaTeX抽出を確認
            assert result is not None
