"""ImageConverter サービス

PyMuPDFを使用したカラースペース変換ユーティリティ
DeviceN/CMYKからRGBへの変換を行う
"""
import logging
from dataclasses import dataclass
from typing import Optional

import pymupdf

logger = logging.getLogger(__name__)


@dataclass
class ExtractedImageInfo:
    """抽出された画像の情報

    Attributes:
        xref: PDF内の画像参照番号
        data: 画像バイナリデータ (PNG形式)
        page_number: 抽出元ページ番号 (0始まり)
        position: ページ内での位置インデックス
    """
    xref: int
    data: bytes
    page_number: int
    position: int


class ImageConverter:
    """PyMuPDFを使用したカラースペース変換クラス

    DeviceN、CMYK等の特殊カラースペースをRGBに変換する。
    """

    @staticmethod
    def convert_pixmap_to_rgb(pix: pymupdf.Pixmap) -> pymupdf.Pixmap:
        """PixmapをRGBに変換する

        CMYK (n=4, alpha=0) や DeviceN (n>4) を RGB に変換する。
        RGB/RGBAの場合はそのまま返す。

        Args:
            pix: 変換元のPixmap

        Returns:
            RGB/RGBA形式のPixmap
        """
        # n - alpha が 3 以下ならすでにRGB/グレースケール
        color_channels = pix.n - pix.alpha
        if color_channels <= 3:
            return pix

        # CMYK, DeviceN等はRGBに変換
        logger.debug(
            f"Converting colorspace: n={pix.n}, alpha={pix.alpha}, "
            f"color_channels={color_channels}"
        )
        return pymupdf.Pixmap(pymupdf.csRGB, pix)

    @staticmethod
    def extract_image_safe(
        doc: pymupdf.Document,
        xref: int,
    ) -> Optional[bytes]:
        """安全に画像を抽出する

        カラースペース変換を行い、失敗時はNoneを返す。

        Args:
            doc: PyMuPDFドキュメント
            xref: 画像の参照番号

        Returns:
            PNG形式の画像バイナリデータ、失敗時はNone
        """
        try:
            pix = pymupdf.Pixmap(doc, xref)

            # CMYK/DeviceN等の場合はRGBに変換
            color_channels = pix.n - pix.alpha
            if color_channels > 3:
                logger.debug(
                    f"Converting image xref={xref}: "
                    f"n={pix.n}, alpha={pix.alpha}"
                )
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)

            return pix.tobytes("png")

        except Exception as e:
            logger.warning(f"Failed to extract image xref={xref}: {e}")
            return None

    @staticmethod
    def extract_image_robust(
        doc: pymupdf.Document,
        xref: int,
    ) -> Optional[bytes]:
        """より堅牢な画像抽出

        通常の方法で失敗した場合、複数のフォールバック方法を試す。

        Args:
            doc: PyMuPDFドキュメント
            xref: 画像の参照番号

        Returns:
            PNG形式の画像バイナリデータ、失敗時はNone
        """
        # 方法1: 通常の抽出
        result = ImageConverter.extract_image_safe(doc, xref)
        if result is not None:
            return result

        # 方法2: extract_imageを使用（base imageとして）
        try:
            base_image = doc.extract_image(xref)
            if base_image:
                image_data = base_image.get("image")
                ext = base_image.get("ext", "png")

                # PNG/JPEG以外の場合は変換を試みる
                if ext in ("png", "jpeg", "jpg"):
                    return image_data

                # Pillowで変換
                try:
                    from PIL import Image
                    from io import BytesIO

                    img = Image.open(BytesIO(image_data))

                    # CMYKの場合はRGBに変換
                    if img.mode == "CMYK":
                        img = img.convert("RGB")
                    elif img.mode not in ("RGB", "RGBA", "L", "LA"):
                        img = img.convert("RGB")

                    output = BytesIO()
                    img.save(output, format="PNG")
                    return output.getvalue()
                except ImportError:
                    logger.warning("Pillow not available for image conversion")
                except Exception as e:
                    logger.warning(f"Pillow conversion failed: {e}")

        except Exception as e:
            logger.debug(f"extract_image failed for xref={xref}: {e}")

        # 方法3: get_pixmapを使用して直接RGBで取得
        try:
            # 画像情報を取得してサイズを決定
            img_info = doc.get_page_images(0)  # Note: need page for context
            for info in img_info:
                if info[0] == xref:
                    width = info[2]
                    height = info[3]

                    # 新しいRGB Pixmapを作成
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, width, height), 1)
                    pix.clear_with(255)  # 白で初期化

                    # 元の画像を描画
                    try:
                        src_pix = pymupdf.Pixmap(doc, xref)
                        # RGBに変換して描画
                        if src_pix.n - src_pix.alpha > 3:
                            src_pix = pymupdf.Pixmap(pymupdf.csRGB, src_pix)
                        pix.copy(src_pix, pix.irect)
                        return pix.tobytes("png")
                    except Exception:
                        pass

        except Exception as e:
            logger.debug(f"Method 3 failed for xref={xref}: {e}")

        logger.warning(f"All extraction methods failed for xref={xref}")
        return None

    @staticmethod
    def extract_all_images(
        doc: pymupdf.Document,
    ) -> list[ExtractedImageInfo]:
        """ドキュメントから全画像を抽出する

        各ページの画像をRGBに変換して抽出する。
        抽出に失敗した画像はスキップして継続する。

        Args:
            doc: PyMuPDFドキュメント

        Returns:
            抽出された画像情報のリスト
        """
        images: list[ExtractedImageInfo] = []
        position = 0

        for page in doc:
            page_images = page.get_images(full=True)

            for img_info in page_images:
                xref = img_info[0]
                data = ImageConverter.extract_image_safe(doc, xref)

                if data is not None:
                    images.append(ExtractedImageInfo(
                        xref=xref,
                        data=data,
                        page_number=page.number,
                        position=position,
                    ))
                    position += 1
                else:
                    logger.warning(
                        f"Skipped image xref={xref} on page {page.number}"
                    )

        logger.info(
            f"Extracted {len(images)} images from document"
        )
        return images
