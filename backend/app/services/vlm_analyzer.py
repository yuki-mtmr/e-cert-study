"""VLM Analyzer サービス

LLaVA via Ollamaを使った画像解析サービス
"""
import asyncio
import base64
import json
import logging
from dataclasses import dataclass, asdict
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# デフォルト設定
DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llava:7b"
DEFAULT_TIMEOUT = 30  # 秒


class VLMAnalyzerError(Exception):
    """VLM Analyzer 基底例外"""
    pass


class VLMConnectionError(VLMAnalyzerError):
    """Ollama接続エラー"""
    pass


class VLMTimeoutError(VLMAnalyzerError):
    """タイムアウトエラー"""
    pass


@dataclass
class VLMAnalysisResult:
    """画像解析結果

    Attributes:
        description: 画像の説明テキスト
        model: 使用したモデル名
        latex_content: 抽出されたLaTeX（数式の場合）
        image_type: 画像タイプ ('diagram', 'formula', 'graph', 'unknown')
    """
    description: str
    model: str
    latex_content: Optional[str] = None
    image_type: str = "unknown"

    def to_dict(self) -> dict:
        """辞書に変換"""
        return asdict(self)


class VLMAnalyzer:
    """LLaVA via Ollamaを使った画像解析クラス

    Ollamaサーバーに接続してVLM（Vision Language Model）による画像解析を実行する。

    Attributes:
        base_url: Ollama API URL
        model: 使用するモデル名
        timeout: リクエストタイムアウト（秒）
    """

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_URL,
        model: str = DEFAULT_MODEL,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        """
        Args:
            base_url: Ollama API URL
            model: 使用するモデル名
            timeout: リクエストタイムアウト（秒）
        """
        self.base_url = base_url
        self.model = model
        self.timeout = timeout

    async def _call_ollama(
        self,
        prompt: str,
        image_base64: str,
    ) -> dict:
        """Ollama APIを呼び出す

        Args:
            prompt: プロンプト
            image_base64: Base64エンコードされた画像

        Returns:
            APIレスポンス

        Raises:
            VLMConnectionError: 接続エラー
            VLMTimeoutError: タイムアウト
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "images": [image_base64],
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException as e:
            logger.error(f"Ollama timeout after {self.timeout}s: {e}")
            raise VLMTimeoutError(f"Timeout after {self.timeout} seconds") from e
        except (httpx.ConnectError, ConnectionError) as e:
            logger.error(f"Ollama connection error: {e}")
            raise VLMConnectionError(f"Connection error: {e}") from e
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e}")
            raise VLMConnectionError(f"HTTP error: {e}") from e

    def _detect_image_type(self, description: str) -> str:
        """説明文から画像タイプを検出

        Args:
            description: 画像の説明

        Returns:
            画像タイプ
        """
        description_lower = description.lower()

        # 数式関連
        if any(word in description_lower for word in [
            "formula", "equation", "mathematical", "math", "数式", "式"
        ]):
            return "formula"

        # グラフ関連
        if any(word in description_lower for word in [
            "graph", "plot", "chart", "グラフ"
        ]):
            return "graph"

        # 図表関連
        if any(word in description_lower for word in [
            "diagram", "flowchart", "architecture", "network", "figure",
            "図", "フローチャート"
        ]):
            return "diagram"

        return "unknown"

    def _extract_latex(self, description: str) -> Optional[str]:
        """説明文からLaTeXを抽出

        Args:
            description: 画像の説明

        Returns:
            抽出されたLaTeX（見つからない場合はNone）
        """
        import re

        # LaTeXブロックを探す
        patterns = [
            r'\$\$(.*?)\$\$',  # $$...$$
            r'\$(.*?)\$',      # $...$
            r'\\begin\{equation\}(.*?)\\end\{equation\}',
            r'\\[(.*?)\\]',    # \[...\]
        ]

        for pattern in patterns:
            match = re.search(pattern, description, re.DOTALL)
            if match:
                return match.group(1).strip()

        return None

    async def analyze(
        self,
        image_data: bytes,
        prompt: Optional[str] = None,
        detect_type: bool = False,
        fallback_on_error: bool = False,
    ) -> Optional[VLMAnalysisResult]:
        """画像を解析する

        Args:
            image_data: 画像バイナリデータ
            prompt: カスタムプロンプト（省略時はデフォルト）
            detect_type: 画像タイプを検出するか
            fallback_on_error: エラー時にNoneを返すか（False時は例外）

        Returns:
            解析結果（fallback_on_error=Trueでエラー時はNone）

        Raises:
            VLMConnectionError: 接続エラー（fallback_on_error=False時）
            VLMTimeoutError: タイムアウト（fallback_on_error=False時）
        """
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        return await self.analyze_base64(
            image_base64=image_base64,
            prompt=prompt,
            detect_type=detect_type,
            fallback_on_error=fallback_on_error,
        )

    async def analyze_base64(
        self,
        image_base64: str,
        prompt: Optional[str] = None,
        detect_type: bool = False,
        fallback_on_error: bool = False,
    ) -> Optional[VLMAnalysisResult]:
        """Base64エンコードされた画像を解析する

        Args:
            image_base64: Base64エンコードされた画像
            prompt: カスタムプロンプト（省略時はデフォルト）
            detect_type: 画像タイプを検出するか
            fallback_on_error: エラー時にNoneを返すか

        Returns:
            解析結果

        Raises:
            VLMConnectionError: 接続エラー（fallback_on_error=False時）
            VLMTimeoutError: タイムアウト（fallback_on_error=False時）
        """
        if prompt is None:
            prompt = (
                "Describe this image in detail. "
                "If it contains mathematical formulas, provide the LaTeX representation. "
                "If it's a diagram or flowchart, describe its structure and content."
            )

        try:
            response = await self._call_ollama(prompt, image_base64)
        except (VLMConnectionError, VLMTimeoutError, asyncio.TimeoutError, ConnectionError) as e:
            if fallback_on_error:
                logger.warning(f"VLM analysis failed, returning None: {e}")
                return None
            if isinstance(e, asyncio.TimeoutError):
                raise VLMTimeoutError(f"Timeout after {self.timeout} seconds") from e
            if isinstance(e, ConnectionError) and not isinstance(e, VLMConnectionError):
                raise VLMConnectionError(f"Connection error: {e}") from e
            raise

        description = response.get("response", "")
        model = response.get("model", self.model)

        # 画像タイプの検出
        image_type = "unknown"
        if detect_type:
            image_type = self._detect_image_type(description)

        # LaTeX抽出（数式タイプの場合）
        latex_content = None
        if image_type == "formula" or "formula" in description.lower():
            latex_content = self._extract_latex(description)

        return VLMAnalysisResult(
            description=description,
            model=model,
            latex_content=latex_content,
            image_type=image_type,
        )


async def analyze_image(
    image_data: bytes,
    prompt: Optional[str] = None,
    base_url: str = DEFAULT_OLLAMA_URL,
    model: str = DEFAULT_MODEL,
    timeout: int = DEFAULT_TIMEOUT,
    fallback_on_error: bool = True,
) -> Optional[VLMAnalysisResult]:
    """画像を解析するヘルパー関数

    Args:
        image_data: 画像バイナリデータ
        prompt: カスタムプロンプト
        base_url: Ollama API URL
        model: 使用するモデル
        timeout: タイムアウト（秒）
        fallback_on_error: エラー時にNoneを返すか

    Returns:
        解析結果（エラー時はNone）
    """
    analyzer = VLMAnalyzer(
        base_url=base_url,
        model=model,
        timeout=timeout,
    )
    return await analyzer.analyze(
        image_data=image_data,
        prompt=prompt,
        detect_type=True,
        fallback_on_error=fallback_on_error,
    )
