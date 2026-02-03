"""MinerU Extractor サービス

MinerU (magic-pdf) を使ったPDFレイアウト解析サービス
DeviceN/CMYKカラースペースの画像をRGBに変換して抽出
"""
import asyncio
import importlib.util
import logging
import tempfile
from dataclasses import dataclass, field
from io import BytesIO
from pathlib import Path
from typing import Optional

import pymupdf

from app.services.image_converter import ImageConverter

logger = logging.getLogger(__name__)

# デフォルトタイムアウト（秒）
DEFAULT_TIMEOUT = 120


class MinerUError(Exception):
    """MinerU 基底例外"""
    pass


class MinerUNotAvailableError(MinerUError):
    """MinerUが利用不可"""
    pass


@dataclass
class ExtractedImage:
    """抽出された画像

    Attributes:
        filename: ファイル名
        data: 画像バイナリデータ
        page_number: 抽出元ページ番号
        position: ページ内での位置
        width: 幅（ピクセル、オプション）
        height: 高さ（ピクセル、オプション）
        caption: キャプション（オプション）
    """
    filename: str
    data: bytes
    page_number: int
    position: int
    width: Optional[int] = None
    height: Optional[int] = None
    caption: Optional[str] = None


@dataclass
class MinerUExtractionResult:
    """MinerU抽出結果

    Attributes:
        markdown: 抽出されたMarkdownテキスト
        images: 抽出された画像のリスト
        metadata: メタデータ
    """
    markdown: str
    images: list[ExtractedImage]
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        """辞書に変換"""
        return {
            "markdown": self.markdown,
            "image_count": len(self.images),
            "images": [
                {
                    "filename": img.filename,
                    "page_number": img.page_number,
                    "position": img.position,
                    "width": img.width,
                    "height": img.height,
                    "caption": img.caption,
                }
                for img in self.images
            ],
            "metadata": self.metadata,
        }


class MinerUExtractor:
    """MinerU PDFレイアウト解析クラス

    magic-pdfを使用してPDFからテキストと画像を抽出する。
    MinerUが利用できない場合はpypdfにフォールバック。

    Attributes:
        timeout: 処理タイムアウト（秒）
    """

    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """
        Args:
            timeout: 処理タイムアウト（秒）
        """
        self.timeout = timeout

    def _is_mineru_available(self) -> bool:
        """MinerUが利用可能かチェック

        Returns:
            利用可能ならTrue
        """
        return importlib.util.find_spec("magic_pdf") is not None

    async def _run_mineru(self, pdf_data: bytes) -> MinerUExtractionResult:
        """MinerUを実行してPDFを処理

        Args:
            pdf_data: PDFバイナリデータ

        Returns:
            抽出結果

        Raises:
            MinerUNotAvailableError: MinerUが利用不可
            MinerUError: 処理エラー
        """
        if not self._is_mineru_available():
            raise MinerUNotAvailableError("MinerU (magic-pdf) is not installed")

        try:
            # magic-pdfを動的インポート
            from magic_pdf.data.data_reader_writer import FileBasedDataReader, FileBasedDataWriter
            from magic_pdf.model.doc_analyze_by_custom_model import doc_analyze
            from magic_pdf.pipe.UNIPipe import UNIPipe

            # 一時ディレクトリで処理
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                input_path = temp_path / "input.pdf"
                output_path = temp_path / "output"
                output_path.mkdir()

                # PDFを一時ファイルに書き込み
                with open(input_path, "wb") as f:
                    f.write(pdf_data)

                # MinerUで処理（非同期で実行）
                def run_extraction():
                    reader = FileBasedDataReader("")
                    writer = FileBasedDataWriter(str(output_path))

                    pdf_bytes = reader.read(str(input_path))
                    model_list = doc_analyze(pdf_bytes)

                    pipe = UNIPipe(pdf_bytes, model_list, writer)
                    pipe.pipe_classify()
                    pipe.pipe_analyze()
                    pipe.pipe_parse()

                    return pipe

                # スレッドプールで実行
                loop = asyncio.get_event_loop()
                pipe = await asyncio.wait_for(
                    loop.run_in_executor(None, run_extraction),
                    timeout=self.timeout,
                )

                # Markdownを取得
                markdown_path = output_path / "input.md"
                if markdown_path.exists():
                    markdown = markdown_path.read_text(encoding="utf-8")
                else:
                    markdown = ""

                # 画像を収集
                images = []
                images_dir = output_path / "images"
                if images_dir.exists():
                    for i, img_path in enumerate(sorted(images_dir.glob("*"))):
                        if img_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif"):
                            images.append(ExtractedImage(
                                filename=img_path.name,
                                data=img_path.read_bytes(),
                                page_number=1,  # MinerUから正確なページ番号を取得する場合は要調整
                                position=i,
                            ))

                return MinerUExtractionResult(
                    markdown=markdown,
                    images=images,
                    metadata={
                        "page_count": len(getattr(pipe, 'page_list', [])) or 1,
                        "image_count": len(images),
                    },
                )

        except asyncio.TimeoutError:
            raise MinerUError(f"MinerU processing timeout after {self.timeout} seconds")
        except MinerUNotAvailableError:
            raise
        except Exception as e:
            logger.error(f"MinerU extraction failed: {e}")
            raise MinerUError(f"MinerU extraction failed: {e}") from e

    async def _fallback_pypdf(self, pdf_data: bytes) -> MinerUExtractionResult:
        """pypdfにフォールバックしてテキスト抽出

        テキストはpypdfで抽出し、画像はPyMuPDFで抽出する。

        Args:
            pdf_data: PDFバイナリデータ

        Returns:
            抽出結果
        """
        from pypdf import PdfReader

        try:
            reader = PdfReader(BytesIO(pdf_data))
            text_parts = []

            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

            markdown = "\n\n".join(text_parts)

            # PyMuPDFで画像抽出（DeviceN/CMYK対応）
            images = await self._extract_images_with_fallback(pdf_data)

            return MinerUExtractionResult(
                markdown=markdown,
                images=images,
                metadata={
                    "page_count": len(reader.pages),
                    "image_count": len(images),
                    "fallback": True,
                },
            )
        except Exception as e:
            raise MinerUError(f"pypdf fallback failed: {e}") from e

    async def _extract_images_with_fallback(
        self,
        pdf_data: bytes,
    ) -> list[ExtractedImage]:
        """PyMuPDFを使用して画像を抽出する

        DeviceN/CMYKカラースペースの画像をRGBに変換して抽出。
        抽出に失敗した画像はスキップして継続する。

        Args:
            pdf_data: PDFバイナリデータ

        Returns:
            抽出された画像のリスト
        """
        images: list[ExtractedImage] = []

        try:
            doc = pymupdf.open(stream=pdf_data, filetype="pdf")
            position = 0

            for page in doc:
                page_images = page.get_images(full=True)

                for img_info in page_images:
                    xref = img_info[0]
                    # より堅牢な抽出メソッドを使用
                    data = ImageConverter.extract_image_robust(doc, xref)

                    if data is not None:
                        # MinerUと同じ命名規則で画像紐付けを可能にする
                        images.append(ExtractedImage(
                            filename=f"image_{position}.png",
                            data=data,
                            page_number=page.number,
                            position=position,
                        ))
                        position += 1
                    else:
                        logger.warning(
                            f"Skipped image xref={xref} on page {page.number}"
                        )

            doc.close()
            logger.info(f"Fallback extracted {len(images)} images")

        except Exception as e:
            logger.error(f"Fallback image extraction failed: {e}")

        return images

    async def extract(
        self,
        pdf_data: bytes,
        fallback_on_error: bool = False,
    ) -> MinerUExtractionResult:
        """PDFからテキストと画像を抽出

        MinerUで画像が抽出できなかった場合、PyMuPDFで直接抽出。
        DeviceN/CMYKカラースペースの画像もRGBに変換して抽出。

        Args:
            pdf_data: PDFバイナリデータ
            fallback_on_error: エラー時にpypdfにフォールバックするか

        Returns:
            抽出結果

        Raises:
            MinerUError: 抽出エラー
            MinerUNotAvailableError: MinerUが利用不可（fallback_on_error=False時）
        """
        if not pdf_data:
            raise MinerUError("Empty PDF data provided")

        try:
            result = await self._run_mineru(pdf_data)

            # MinerUで画像が抽出できなかった場合、PyMuPDFでフォールバック
            if len(result.images) == 0:
                logger.info("No images from MinerU, attempting fallback extraction")
                fallback_images = await self._extract_images_with_fallback(pdf_data)

                if fallback_images:
                    result = MinerUExtractionResult(
                        markdown=result.markdown,
                        images=fallback_images,
                        metadata={
                            **result.metadata,
                            "image_count": len(fallback_images),
                            "fallback_used": True,
                        },
                    )

            return result

        except MinerUNotAvailableError:
            if fallback_on_error:
                logger.warning("MinerU not available, falling back to pypdf")
                return await self._fallback_pypdf(pdf_data)
            raise
        except asyncio.TimeoutError:
            raise MinerUError(f"MinerU processing timeout after {self.timeout} seconds")
        except MinerUError:
            if fallback_on_error:
                logger.warning("MinerU failed, falling back to pypdf")
                return await self._fallback_pypdf(pdf_data)
            raise


async def extract_pdf_with_layout(
    pdf_data: bytes,
    timeout: int = DEFAULT_TIMEOUT,
    fallback_on_error: bool = True,
) -> MinerUExtractionResult:
    """PDFからレイアウトを保持して抽出するヘルパー関数

    Args:
        pdf_data: PDFバイナリデータ
        timeout: タイムアウト（秒）
        fallback_on_error: エラー時にpypdfにフォールバックするか

    Returns:
        抽出結果
    """
    extractor = MinerUExtractor(timeout=timeout)
    return await extractor.extract(
        pdf_data=pdf_data,
        fallback_on_error=fallback_on_error,
    )
