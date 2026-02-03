"""ImageConverter サービスのテスト

PyMuPDFを使用したカラースペース変換のテスト
DeviceN/CMYKからRGBへの変換をテスト
"""
from unittest.mock import MagicMock, patch

import pytest


class TestImageConverterConvertPixmapToRgb:
    """convert_pixmap_to_rgb メソッドのテスト"""

    def test_convert_cmyk_to_rgb(self):
        """CMYK Pixmap を RGB に変換できる"""
        from app.services.image_converter import ImageConverter

        # CMYKは4チャンネル (n=4, alpha=0)
        mock_cmyk_pix = MagicMock()
        mock_cmyk_pix.n = 4
        mock_cmyk_pix.alpha = 0

        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0

        with patch("pymupdf.Pixmap", return_value=mock_rgb_pix) as mock_pixmap:
            with patch("pymupdf.csRGB") as mock_cs_rgb:
                result = ImageConverter.convert_pixmap_to_rgb(mock_cmyk_pix)

                # RGB変換が呼ばれたか確認
                mock_pixmap.assert_called_once_with(mock_cs_rgb, mock_cmyk_pix)
                assert result == mock_rgb_pix

    def test_convert_devicen_to_rgb(self):
        """DeviceN Pixmap を RGB に変換できる"""
        from app.services.image_converter import ImageConverter

        # DeviceNは5チャンネル以上 (n=5, alpha=0)
        mock_devicen_pix = MagicMock()
        mock_devicen_pix.n = 5
        mock_devicen_pix.alpha = 0

        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0

        with patch("pymupdf.Pixmap", return_value=mock_rgb_pix) as mock_pixmap:
            with patch("pymupdf.csRGB") as mock_cs_rgb:
                result = ImageConverter.convert_pixmap_to_rgb(mock_devicen_pix)

                mock_pixmap.assert_called_once_with(mock_cs_rgb, mock_devicen_pix)
                assert result == mock_rgb_pix

    def test_rgb_pixmap_returns_unchanged(self):
        """RGB Pixmap はそのまま返される"""
        from app.services.image_converter import ImageConverter

        # RGBは3チャンネル (n=3, alpha=0)
        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0

        with patch("pymupdf.Pixmap") as mock_pixmap:
            result = ImageConverter.convert_pixmap_to_rgb(mock_rgb_pix)

            # 変換は呼ばれないはず
            mock_pixmap.assert_not_called()
            assert result == mock_rgb_pix

    def test_rgba_pixmap_returns_unchanged(self):
        """RGBA Pixmap (アルファチャンネル付き) はそのまま返される"""
        from app.services.image_converter import ImageConverter

        # RGBAは4チャンネル (n=4, alpha=1)
        mock_rgba_pix = MagicMock()
        mock_rgba_pix.n = 4
        mock_rgba_pix.alpha = 1  # アルファチャンネルあり

        with patch("pymupdf.Pixmap") as mock_pixmap:
            result = ImageConverter.convert_pixmap_to_rgb(mock_rgba_pix)

            # 変換は呼ばれないはず（n - alpha = 3 なのでRGB）
            mock_pixmap.assert_not_called()
            assert result == mock_rgba_pix


class TestImageConverterExtractImageSafe:
    """extract_image_safe メソッドのテスト"""

    def test_extract_rgb_image_success(self):
        """RGB画像を正常に抽出できる"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_pix = MagicMock()
        mock_pix.n = 3
        mock_pix.alpha = 0
        mock_pix.tobytes.return_value = b"fake_png_data"

        with patch("pymupdf.Pixmap", return_value=mock_pix):
            result = ImageConverter.extract_image_safe(mock_doc, xref=1)

            assert result == b"fake_png_data"
            mock_pix.tobytes.assert_called_once_with("png")

    def test_extract_cmyk_image_converts_to_rgb(self):
        """CMYK画像をRGBに変換して抽出できる"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_cmyk_pix = MagicMock()
        mock_cmyk_pix.n = 4
        mock_cmyk_pix.alpha = 0

        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0
        mock_rgb_pix.tobytes.return_value = b"converted_png_data"

        # Pixmapコンストラクタの呼び出しを模倣
        def pixmap_side_effect(*args):
            if len(args) == 2:
                # (doc, xref) -> CMYK Pixmap
                if isinstance(args[1], int):
                    return mock_cmyk_pix
                # (csRGB, pix) -> RGB Pixmap
                return mock_rgb_pix
            return mock_cmyk_pix

        with patch("pymupdf.Pixmap", side_effect=pixmap_side_effect):
            with patch("pymupdf.csRGB"):
                result = ImageConverter.extract_image_safe(mock_doc, xref=1)

                assert result == b"converted_png_data"

    def test_extract_devicen_image_converts_to_rgb(self):
        """DeviceN画像をRGBに変換して抽出できる"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_devicen_pix = MagicMock()
        mock_devicen_pix.n = 6  # DeviceN (6チャンネル)
        mock_devicen_pix.alpha = 0

        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0
        mock_rgb_pix.tobytes.return_value = b"devicen_converted_data"

        def pixmap_side_effect(*args):
            if len(args) == 2:
                if isinstance(args[1], int):
                    return mock_devicen_pix
                return mock_rgb_pix
            return mock_devicen_pix

        with patch("pymupdf.Pixmap", side_effect=pixmap_side_effect):
            with patch("pymupdf.csRGB"):
                result = ImageConverter.extract_image_safe(mock_doc, xref=1)

                assert result == b"devicen_converted_data"

    def test_extract_image_safe_returns_none_on_failure(self):
        """抽出失敗時にNoneを返す"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()

        with patch("pymupdf.Pixmap", side_effect=Exception("Extraction failed")):
            result = ImageConverter.extract_image_safe(mock_doc, xref=999)

            assert result is None

    def test_extract_image_safe_returns_none_on_conversion_failure(self):
        """カラースペース変換失敗時にNoneを返す"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_cmyk_pix = MagicMock()
        mock_cmyk_pix.n = 4
        mock_cmyk_pix.alpha = 0

        call_count = [0]

        def pixmap_side_effect(*args):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_cmyk_pix
            raise Exception("Conversion failed")

        with patch("pymupdf.Pixmap", side_effect=pixmap_side_effect):
            with patch("pymupdf.csRGB"):
                result = ImageConverter.extract_image_safe(mock_doc, xref=1)

                assert result is None


class TestImageConverterExtractAllImages:
    """extract_all_images メソッドのテスト"""

    def test_extract_all_images_from_document(self):
        """ドキュメントから全画像を抽出できる"""
        from app.services.image_converter import ImageConverter, ExtractedImageInfo

        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.number = 0
        # get_images returns: (xref, smask, width, height, bpc, colorspace, alt, name, filter, invoker)
        mock_page.get_images.return_value = [
            (1, 0, 100, 200, 8, "DeviceRGB", "", "img1", "", ""),
            (2, 0, 150, 250, 8, "DeviceCMYK", "", "img2", "", ""),
        ]
        mock_doc.__iter__ = lambda self: iter([mock_page])

        mock_pix = MagicMock()
        mock_pix.n = 3
        mock_pix.alpha = 0
        mock_pix.tobytes.return_value = b"image_data"

        with patch("pymupdf.Pixmap", return_value=mock_pix):
            result = ImageConverter.extract_all_images(mock_doc)

            assert len(result) == 2
            assert all(isinstance(img, ExtractedImageInfo) for img in result)
            assert result[0].xref == 1
            assert result[0].page_number == 0
            assert result[1].xref == 2

    def test_extract_all_images_skips_failed(self):
        """抽出失敗した画像をスキップして継続する"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.number = 0
        mock_page.get_images.return_value = [
            (1, 0, 100, 200, 8, "DeviceRGB", "", "img1", "", ""),
            (2, 0, 150, 250, 8, "DeviceN", "", "img2", "", ""),  # 失敗する画像
            (3, 0, 200, 300, 8, "DeviceRGB", "", "img3", "", ""),
        ]
        mock_doc.__iter__ = lambda self: iter([mock_page])

        call_count = [0]

        def pixmap_side_effect(*args):
            call_count[0] += 1
            if call_count[0] == 2:  # 2番目の呼び出しで失敗
                raise Exception("DeviceN extraction failed")
            mock_pix = MagicMock()
            mock_pix.n = 3
            mock_pix.alpha = 0
            mock_pix.tobytes.return_value = b"image_data"
            return mock_pix

        with patch("pymupdf.Pixmap", side_effect=pixmap_side_effect):
            result = ImageConverter.extract_all_images(mock_doc)

            # 3つ中2つが成功
            assert len(result) == 2
            assert result[0].xref == 1
            assert result[1].xref == 3

    def test_extract_all_images_returns_empty_on_no_images(self):
        """画像がない場合は空リストを返す"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.get_images.return_value = []
        mock_doc.__iter__ = lambda self: iter([mock_page])

        result = ImageConverter.extract_all_images(mock_doc)

        assert result == []

    def test_extract_all_images_logs_skipped_images(self):
        """スキップした画像がログに出力される"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.number = 0
        mock_page.get_images.return_value = [
            (1, 0, 100, 200, 8, "DeviceN", "", "img1", "", ""),
        ]
        mock_doc.__iter__ = lambda self: iter([mock_page])

        with patch("pymupdf.Pixmap", side_effect=Exception("Failed")):
            with patch("app.services.image_converter.logger") as mock_logger:
                result = ImageConverter.extract_all_images(mock_doc)

                assert result == []
                # warningが呼ばれたことを確認
                assert mock_logger.warning.called


class TestImageConverterExtractImageRobust:
    """extract_image_robust メソッドのテスト"""

    def test_extract_with_regular_method_success(self):
        """通常の方法で画像を正常に抽出できる"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_pix = MagicMock()
        mock_pix.n = 3
        mock_pix.alpha = 0
        mock_pix.tobytes.return_value = b"fake_png_data"

        with patch("pymupdf.Pixmap", return_value=mock_pix):
            result = ImageConverter.extract_image_robust(mock_doc, xref=1)

            assert result == b"fake_png_data"

    def test_extract_with_fallback_on_tobytes_failure(self):
        """tobytes失敗時にフォールバック方法で抽出できる"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()
        mock_pix = MagicMock()
        mock_pix.n = 4  # CMYK
        mock_pix.alpha = 0
        mock_pix.width = 100
        mock_pix.height = 100
        mock_pix.samples = b"\x00" * (100 * 100 * 4)
        mock_pix.tobytes.side_effect = Exception("pixmap must be grayscale or rgb")

        mock_rgb_pix = MagicMock()
        mock_rgb_pix.n = 3
        mock_rgb_pix.alpha = 0
        mock_rgb_pix.tobytes.return_value = b"converted_png"

        call_count = [0]

        def pixmap_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_pix  # 最初の呼び出し：CMYK
            return mock_rgb_pix  # 2回目以降：変換後

        with patch("pymupdf.Pixmap", side_effect=pixmap_side_effect):
            with patch("pymupdf.csRGB"):
                result = ImageConverter.extract_image_robust(mock_doc, xref=1)

                # フォールバックが成功
                assert result is not None

    def test_extract_returns_none_when_all_methods_fail(self):
        """全ての方法が失敗した場合はNoneを返す"""
        from app.services.image_converter import ImageConverter

        mock_doc = MagicMock()

        with patch("pymupdf.Pixmap", side_effect=Exception("All methods failed")):
            result = ImageConverter.extract_image_robust(mock_doc, xref=999)

            assert result is None
