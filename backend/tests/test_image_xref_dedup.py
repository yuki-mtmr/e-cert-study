"""画像xref重複排除テスト

PyMuPDFでの画像抽出時に同一xrefの画像を重複抽出しないことをテスト。
"""
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

from app.services.mineru_extractor import MinerUExtractor


class FakePage:
    """テスト用のPyMuPDFページモック"""

    def __init__(self, page_number: int, images: list[tuple]):
        self.number = page_number
        self._images = images

    def get_images(self, full: bool = True) -> list[tuple]:
        return self._images


class FakeDoc:
    """テスト用のPyMuPDFドキュメントモック"""

    def __init__(self, pages: list[FakePage]):
        self._pages = pages

    def __iter__(self):
        return iter(self._pages)

    def close(self):
        pass


@pytest.mark.asyncio
class TestXrefDedup:
    """xref重複排除テスト"""

    @patch("app.services.mineru_extractor.ImageConverter")
    @patch("app.services.mineru_extractor.pymupdf")
    async def test_duplicate_xref_skipped(self, mock_pymupdf, mock_converter):
        """同一xrefの画像は1回しか抽出されない"""
        # xref=10が2ページにまたがって出現するケース
        page1 = FakePage(0, [(10, 0, 0, 0, 0, 0, 0, 0, 0, 0)])
        page2 = FakePage(1, [(10, 0, 0, 0, 0, 0, 0, 0, 0, 0)])
        doc = FakeDoc([page1, page2])
        mock_pymupdf.open.return_value = doc
        mock_converter.extract_image_robust.return_value = b"fake_png_data"

        extractor = MinerUExtractor()
        images = await extractor._extract_images_with_fallback(b"fake_pdf")

        # 同一xref=10 → 1回だけ抽出される
        assert len(images) == 1
        assert images[0].filename == "image_0.png"

    @patch("app.services.mineru_extractor.ImageConverter")
    @patch("app.services.mineru_extractor.pymupdf")
    async def test_different_xrefs_all_extracted(self, mock_pymupdf, mock_converter):
        """異なるxrefの画像はすべて抽出される"""
        page1 = FakePage(0, [
            (10, 0, 0, 0, 0, 0, 0, 0, 0, 0),
            (20, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        ])
        page2 = FakePage(1, [
            (30, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        ])
        doc = FakeDoc([page1, page2])
        mock_pymupdf.open.return_value = doc
        mock_converter.extract_image_robust.return_value = b"fake_png_data"

        extractor = MinerUExtractor()
        images = await extractor._extract_images_with_fallback(b"fake_pdf")

        assert len(images) == 3

    @patch("app.services.mineru_extractor.ImageConverter")
    @patch("app.services.mineru_extractor.pymupdf")
    async def test_duplicate_xref_same_page(self, mock_pymupdf, mock_converter):
        """同一ページ内のxref重複も排除される"""
        page1 = FakePage(0, [
            (10, 0, 0, 0, 0, 0, 0, 0, 0, 0),
            (10, 0, 0, 0, 0, 0, 0, 0, 0, 0),
            (20, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        ])
        doc = FakeDoc([page1])
        mock_pymupdf.open.return_value = doc
        mock_converter.extract_image_robust.return_value = b"fake_png_data"

        extractor = MinerUExtractor()
        images = await extractor._extract_images_with_fallback(b"fake_pdf")

        # xref=10は1回、xref=20は1回 → 計2個
        assert len(images) == 2

    @patch("app.services.mineru_extractor.ImageConverter")
    @patch("app.services.mineru_extractor.pymupdf")
    async def test_failed_extraction_skipped(self, mock_pymupdf, mock_converter):
        """抽出失敗した画像はスキップされる（既存動作確認）"""
        page1 = FakePage(0, [
            (10, 0, 0, 0, 0, 0, 0, 0, 0, 0),
            (20, 0, 0, 0, 0, 0, 0, 0, 0, 0),
        ])
        doc = FakeDoc([page1])
        mock_pymupdf.open.return_value = doc
        # xref=10は成功、xref=20は失敗
        mock_converter.extract_image_robust.side_effect = [b"fake_png_data", None]

        extractor = MinerUExtractor()
        images = await extractor._extract_images_with_fallback(b"fake_pdf")

        assert len(images) == 1
