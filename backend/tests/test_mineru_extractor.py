"""MinerU Extractor サービスのテスト

MinerU (magic-pdf) を使ったPDFレイアウト解析サービスのテスト
"""
import tempfile
import shutil
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.mineru_extractor import (
    MinerUExtractor,
    MinerUExtractionResult,
    MinerUError,
    MinerUNotAvailableError,
    extract_pdf_with_layout,
    ExtractedImage,
)


# テスト用の最小PDFバイナリ
# PDF 1.4形式の最小構造
TEST_PDF_BYTES = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Hello World) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer << /Size 5 /Root 1 0 R >>
startxref
307
%%EOF"""


class TestMinerUExtractor:
    """MinerUExtractorクラスのテスト"""

    def test_extractor_initialization(self):
        """エクストラクタの初期化テスト"""
        extractor = MinerUExtractor()
        assert extractor.timeout == 120

    def test_extractor_custom_timeout(self):
        """カスタムタイムアウトのテスト"""
        extractor = MinerUExtractor(timeout=60)
        assert extractor.timeout == 60

    @pytest.mark.asyncio
    async def test_extract_success(self):
        """PDF抽出成功のテスト"""
        extractor = MinerUExtractor()

        mock_result = MinerUExtractionResult(
            markdown="# Test Document\n\nHello World",
            images=[],
            metadata={"page_count": 1},
        )

        with patch.object(
            extractor, "_run_mineru", new_callable=AsyncMock
        ) as mock_run:
            mock_run.return_value = mock_result

            result = await extractor.extract(TEST_PDF_BYTES)

            assert isinstance(result, MinerUExtractionResult)
            assert "Hello World" in result.markdown
            mock_run.assert_called_once()

    @pytest.mark.asyncio
    async def test_extract_with_images(self):
        """画像付きPDF抽出のテスト"""
        extractor = MinerUExtractor()

        mock_result = MinerUExtractionResult(
            markdown="# Document\n\n![Figure 1](image_0.png)\n\nSome text",
            images=[
                ExtractedImage(
                    filename="image_0.png",
                    data=b"fake_png_data",
                    page_number=1,
                    position=0,
                )
            ],
            metadata={"page_count": 1, "image_count": 1},
        )

        with patch.object(
            extractor, "_run_mineru", new_callable=AsyncMock
        ) as mock_run:
            mock_run.return_value = mock_result

            result = await extractor.extract(TEST_PDF_BYTES)

            assert len(result.images) == 1
            assert result.images[0].filename == "image_0.png"

    @pytest.mark.asyncio
    async def test_extract_mineru_not_available(self):
        """MinerUが利用不可の場合のテスト"""
        extractor = MinerUExtractor()

        with patch.object(
            extractor, "_run_mineru", new_callable=AsyncMock
        ) as mock_run:
            mock_run.side_effect = MinerUNotAvailableError("MinerU not installed")

            with pytest.raises(MinerUNotAvailableError):
                await extractor.extract(TEST_PDF_BYTES)

    @pytest.mark.asyncio
    async def test_extract_with_fallback(self):
        """フォールバック時のテスト"""
        extractor = MinerUExtractor()

        with patch.object(
            extractor, "_run_mineru", new_callable=AsyncMock
        ) as mock_run:
            mock_run.side_effect = MinerUNotAvailableError("Not available")

            # フォールバックは pypdf を使用
            with patch.object(
                extractor, "_fallback_pypdf", new_callable=AsyncMock
            ) as mock_fallback:
                mock_fallback.return_value = MinerUExtractionResult(
                    markdown="Simple text extracted",
                    images=[],
                    metadata={"fallback": True},
                )

                result = await extractor.extract(
                    TEST_PDF_BYTES,
                    fallback_on_error=True,
                )

                assert result is not None
                assert result.metadata.get("fallback") is True

    @pytest.mark.asyncio
    async def test_extract_timeout(self):
        """タイムアウトのテスト"""
        extractor = MinerUExtractor(timeout=1)

        with patch.object(
            extractor, "_run_mineru", new_callable=AsyncMock
        ) as mock_run:
            import asyncio
            mock_run.side_effect = asyncio.TimeoutError()

            with pytest.raises(MinerUError) as exc_info:
                await extractor.extract(TEST_PDF_BYTES)

            assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_extract_empty_pdf(self):
        """空のPDFデータのテスト"""
        extractor = MinerUExtractor()

        with pytest.raises(MinerUError) as exc_info:
            await extractor.extract(b"")

        assert "empty" in str(exc_info.value).lower()


class TestMinerUExtractionResult:
    """MinerUExtractionResultのテスト"""

    def test_result_creation(self):
        """結果オブジェクト作成のテスト"""
        result = MinerUExtractionResult(
            markdown="# Test\n\nContent",
            images=[],
            metadata={"page_count": 1},
        )

        assert result.markdown == "# Test\n\nContent"
        assert len(result.images) == 0
        assert result.metadata["page_count"] == 1

    def test_result_with_images(self):
        """画像付き結果のテスト"""
        images = [
            ExtractedImage(
                filename="img1.png",
                data=b"data1",
                page_number=1,
                position=0,
            ),
            ExtractedImage(
                filename="img2.png",
                data=b"data2",
                page_number=1,
                position=1,
            ),
        ]

        result = MinerUExtractionResult(
            markdown="# Test",
            images=images,
            metadata={},
        )

        assert len(result.images) == 2
        assert result.images[0].filename == "img1.png"
        assert result.images[1].filename == "img2.png"

    def test_result_to_dict(self):
        """辞書変換のテスト"""
        result = MinerUExtractionResult(
            markdown="# Test",
            images=[],
            metadata={"page_count": 1},
        )

        result_dict = result.to_dict()
        assert result_dict["markdown"] == "# Test"
        assert result_dict["image_count"] == 0
        assert result_dict["metadata"]["page_count"] == 1


class TestExtractedImage:
    """ExtractedImageのテスト"""

    def test_image_creation(self):
        """画像オブジェクト作成のテスト"""
        image = ExtractedImage(
            filename="test.png",
            data=b"png_data",
            page_number=1,
            position=0,
        )

        assert image.filename == "test.png"
        assert image.data == b"png_data"
        assert image.page_number == 1
        assert image.position == 0

    def test_image_with_optional_fields(self):
        """オプショナルフィールド付き画像のテスト"""
        image = ExtractedImage(
            filename="test.png",
            data=b"png_data",
            page_number=1,
            position=0,
            width=100,
            height=200,
            caption="Test figure",
        )

        assert image.width == 100
        assert image.height == 200
        assert image.caption == "Test figure"


class TestExtractPdfWithLayout:
    """extract_pdf_with_layout関数のテスト"""

    @pytest.mark.asyncio
    async def test_helper_function(self):
        """ヘルパー関数のテスト"""
        with patch(
            "app.services.mineru_extractor.MinerUExtractor.extract",
            new_callable=AsyncMock,
        ) as mock_extract:
            mock_extract.return_value = MinerUExtractionResult(
                markdown="# Test",
                images=[],
                metadata={},
            )

            result = await extract_pdf_with_layout(TEST_PDF_BYTES)

            assert result is not None
            assert result.markdown == "# Test"


class TestPypdfFallback:
    """pypdfフォールバックのテスト"""

    @pytest.mark.asyncio
    async def test_fallback_extraction(self):
        """フォールバック抽出のテスト"""
        extractor = MinerUExtractor()

        # pypdfは画像を抽出しない
        with patch("pypdf.PdfReader") as MockReader:
            mock_reader = MockReader.return_value
            mock_page = MagicMock()
            mock_page.extract_text.return_value = "Plain text content"
            mock_reader.pages = [mock_page]

            result = await extractor._fallback_pypdf(TEST_PDF_BYTES)

            assert result is not None
            assert "Plain text content" in result.markdown
            assert len(result.images) == 0
            assert result.metadata.get("fallback") is True


class TestMinerUAvailability:
    """MinerU利用可能性チェックのテスト"""

    def test_check_mineru_installed(self):
        """MinerUインストールチェックのテスト"""
        extractor = MinerUExtractor()

        with patch("app.services.mineru_extractor.importlib.util.find_spec") as mock_find:
            mock_find.return_value = MagicMock()  # モジュールが見つかる
            assert extractor._is_mineru_available() is True

            mock_find.return_value = None  # モジュールが見つからない
            assert extractor._is_mineru_available() is False
