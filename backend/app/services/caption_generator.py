"""キャプション生成サービス

PDF/画像からキャプションを生成するサービス。
Qwen2-VL-2Bを使用し、macOSではMetal (MPS) をサポート。
"""
import logging
from typing import Any, Optional

from PIL import Image

logger = logging.getLogger(__name__)

# scripts.generate_captionsからインポート（遅延）
_generator_instance: Optional[Any] = None


class CaptionGeneratorService:
    """画像キャプション生成サービス

    Qwen2-VL-2Bを使用して画像からキャプションを生成する。
    macOSではMetal Performance Shaders (MPS) を自動的に使用。
    """

    def __init__(self, device: Optional[str] = None):
        """
        Args:
            device: 使用するデバイス（"mps", "cuda", "cpu", None=自動選択）
        """
        self.device = device
        self._generator: Optional[Any] = None

    def _get_generator(self) -> Any:
        """CaptionGeneratorインスタンスを取得（遅延ロード）"""
        if self._generator is None:
            from scripts.generate_captions import CaptionGenerator

            self._generator = CaptionGenerator.load(device=self.device)

        return self._generator

    async def generate(
        self,
        images: list[dict[str, Any]],
        skip_model_load: bool = False,
    ) -> list[dict[str, Any]]:
        """画像リストからキャプションを生成

        Args:
            images: 画像情報のリスト（各画像にはimage, page, xrefキーが必要）
            skip_model_load: モデルロードをスキップ（テスト用）

        Returns:
            キャプションデータのリスト
        """
        if not images:
            return []

        if skip_model_load:
            # テスト用：モックされたジェネレータを使用
            return []

        generator = self._get_generator()
        captions: list[dict[str, Any]] = []

        for img_data in images:
            try:
                result = generator.generate_caption(
                    image=img_data["image"],
                    page_number=img_data.get("page", 0),
                    xref=img_data.get("xref", 0),
                )
                if result:
                    captions.append(result)
            except Exception as e:
                logger.error(f"Failed to generate caption: {e}")
                continue

        return captions

    async def generate_from_pdf(
        self,
        pdf_data: bytes,
        limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """PDFから画像を抽出しキャプションを生成

        Args:
            pdf_data: PDFバイナリデータ
            limit: 処理する最大画像数

        Returns:
            キャプションデータのリスト
        """
        from scripts.generate_captions import extract_images_from_pdf

        # 画像を抽出
        images = extract_images_from_pdf(pdf_data, limit=limit)

        if not images:
            logger.warning("No images found in PDF")
            return []

        return await self.generate(images=images)

    async def generate_single(
        self,
        image: Image.Image,
        page: int = 0,
        xref: int = 0,
    ) -> Optional[dict[str, Any]]:
        """単一画像からキャプションを生成

        Args:
            image: PIL画像
            page: ページ番号
            xref: PDFオブジェクト参照ID

        Returns:
            キャプションデータ（エラー時はNone）
        """
        generator = self._get_generator()

        try:
            return generator.generate_caption(
                image=image,
                page_number=page,
                xref=xref,
            )
        except Exception as e:
            logger.error(f"Failed to generate caption: {e}")
            return None
