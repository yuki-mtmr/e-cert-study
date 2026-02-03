"""画像キャプション生成スクリプト

Qwen2-VL-2Bを使用してPDF内の画像からキャプションを生成する。
macOSではMetal Performance Shaders (MPS) をサポート。

使用方法:
    python -m scripts.generate_captions --pdf /path/to/file.pdf --output captions.json

依存関係:
    pip install transformers>=4.45.0 accelerate qwen-vl-utils pillow pymupdf torch
"""
import argparse
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

import pymupdf
from PIL import Image

logger = logging.getLogger(__name__)

# torchはオプショナルインポート
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    torch = None  # type: ignore
    TORCH_AVAILABLE = False


def get_best_device(preferred: Optional[str] = None) -> str:
    """利用可能な最適なデバイスを取得

    macOSではMetal Performance Shaders (MPS) を優先的に使用。

    Args:
        preferred: 優先するデバイス（"mps", "cuda", "cpu"）

    Returns:
        デバイス名（"mps", "cuda", "cpu"のいずれか）
    """
    if not TORCH_AVAILABLE:
        return "cpu"

    # 明示的な指定がある場合
    if preferred == "cpu":
        return "cpu"
    if preferred == "mps":
        if torch.backends.mps.is_available() and torch.backends.mps.is_built():
            return "mps"
        logger.warning("MPS requested but not available, falling back to CPU")
        return "cpu"
    if preferred == "cuda":
        if torch.cuda.is_available():
            return "cuda"
        logger.warning("CUDA requested but not available, falling back to CPU")
        return "cpu"

    # 自動選択: MPS > CUDA > CPU
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        logger.info("Using MPS (Metal Performance Shaders) for GPU acceleration")
        return "mps"
    if torch.cuda.is_available():
        logger.info("Using CUDA for GPU acceleration")
        return "cuda"

    logger.info("Using CPU (no GPU acceleration available)")
    return "cpu"


# transformersのインポート（遅延インポート）
try:
    from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    Qwen2VLForConditionalGeneration = None  # type: ignore
    AutoProcessor = None  # type: ignore
    TRANSFORMERS_AVAILABLE = False

# デフォルトプロンプト
DEFAULT_PROMPT = (
    "この画像を日本語で簡潔に説明してください。"
    "図やグラフの場合は内容も説明してください。"
    "数式の場合はLaTeX形式で記述してください。"
)


@dataclass
class CaptionResult:
    """キャプション生成結果

    Attributes:
        page: ページ番号
        xref: PDFオブジェクトの参照ID
        caption: 生成されたキャプション
        image_data: 画像バイナリデータ（オプション）
    """
    page: int
    xref: int
    caption: str
    image_data: Optional[bytes] = None

    def to_dict(self) -> dict[str, Any]:
        """辞書に変換（image_dataを除く）"""
        return {
            "page": self.page,
            "xref": self.xref,
            "caption": self.caption,
        }


class CaptionGenerator:
    """Qwen2-VL-2Bを使用した画像キャプション生成器

    Attributes:
        model: Qwen2-VLモデル
        processor: Qwen2-VLプロセッサ
        prompt: キャプション生成プロンプト
    """

    def __init__(
        self,
        model: Any,
        processor: Any,
        prompt: str = DEFAULT_PROMPT,
    ):
        """
        Args:
            model: Qwen2-VLモデル
            processor: Qwen2-VLプロセッサ
            prompt: キャプション生成プロンプト
        """
        self.model = model
        self.processor = processor
        self.prompt = prompt

    @classmethod
    def load(
        cls,
        model_name: str = "Qwen/Qwen2-VL-2B-Instruct",
        device: Optional[str] = None,
    ) -> "CaptionGenerator":
        """モデルをロードしてCaptionGeneratorを作成

        macOSではMetal Performance Shaders (MPS) を自動的に使用。

        Args:
            model_name: Hugging Faceモデル名
            device: 使用するデバイス（"mps", "cuda", "cpu", None=自動選択）

        Returns:
            CaptionGeneratorインスタンス
        """
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "Qwen2-VLの依存関係がインストールされていません。"
                "pip install transformers>=4.45.0 accelerate qwen-vl-utils torch"
            )

        # デバイス選択
        selected_device = get_best_device(preferred=device)

        logger.info(f"Loading model: {model_name} on device: {selected_device}")

        # MPSの場合の特別処理
        if selected_device == "mps":
            # MPSはdevice_map="auto"をサポートしないため直接指定
            model = Qwen2VLForConditionalGeneration.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map=selected_device,
            )
        else:
            # CUDA/CPUの場合は通常通り
            model = Qwen2VLForConditionalGeneration.from_pretrained(
                model_name,
                torch_dtype="auto",
                device_map=selected_device if selected_device != "cpu" else None,
            )

        processor = AutoProcessor.from_pretrained(model_name)

        logger.info(f"Model loaded successfully on {selected_device}")
        return cls(model=model, processor=processor)

    def generate_caption(
        self,
        image: Image.Image,
        page_number: int,
        xref: int,
        max_new_tokens: int = 256,
    ) -> Optional[dict[str, Any]]:
        """画像からキャプションを生成

        Args:
            image: PIL画像
            page_number: ページ番号
            xref: PDFオブジェクト参照ID
            max_new_tokens: 生成する最大トークン数

        Returns:
            キャプションデータ（エラー時はNone）
        """
        try:
            # qwen_vl_utilsがある場合のみインポート
            try:
                from qwen_vl_utils import process_vision_info
                has_vl_utils = True
            except ImportError:
                has_vl_utils = False

            # メッセージ形式でプロンプトを構築
            messages = [{
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": self.prompt},
                ],
            }]

            # テキスト入力を準備
            text = self.processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )

            # 画像入力を処理
            if has_vl_utils:
                image_inputs, video_inputs = process_vision_info(messages)
                inputs = self.processor(
                    text=[text],
                    images=image_inputs,
                    videos=video_inputs,
                    return_tensors="pt",
                )
            else:
                inputs = self.processor(
                    text=[text],
                    images=[image],
                    return_tensors="pt",
                )

            # デバイスに移動
            if hasattr(self.model, 'device'):
                inputs = inputs.to(self.model.device)

            # 生成
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
            )

            # デコード
            generated = self.processor.batch_decode(
                output_ids,
                skip_special_tokens=True,
            )

            caption = generated[0] if generated else ""

            return {
                "page": page_number,
                "xref": xref,
                "caption": caption,
            }

        except Exception as e:
            logger.error(f"Caption generation failed for xref={xref}: {e}")
            return None


def extract_images_from_pdf(
    pdf_data: bytes,
    limit: Optional[int] = None,
) -> list[dict[str, Any]]:
    """PDFから画像を抽出

    Args:
        pdf_data: PDFバイナリデータ
        limit: 抽出する最大画像数

    Returns:
        画像情報のリスト

    Raises:
        Exception: PDF読み込みエラー
    """
    images: list[dict[str, Any]] = []

    doc = pymupdf.open(stream=pdf_data, filetype="pdf")
    count = 0

    try:
        for page in doc:
            for img_info in page.get_images(full=True):
                if limit and count >= limit:
                    break

                xref = img_info[0]

                try:
                    pix = pymupdf.Pixmap(doc, xref)

                    # RGB変換（必要な場合）
                    if pix.n - pix.alpha > 3:
                        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)

                    # PIL Imageに変換
                    img = Image.frombytes(
                        "RGB",
                        [pix.width, pix.height],
                        pix.samples,
                    )

                    # 画像データも保存（後でファイルに保存するため）
                    import io
                    img_bytes = io.BytesIO()
                    img.save(img_bytes, format='PNG')

                    images.append({
                        "image": img,
                        "page": page.number,
                        "xref": xref,
                        "width": pix.width,
                        "height": pix.height,
                        "image_data": img_bytes.getvalue(),
                    })

                    count += 1
                    logger.debug(f"Extracted image xref={xref} from page {page.number}")

                except Exception as e:
                    logger.warning(f"Failed to extract image xref={xref}: {e}")
                    continue

            if limit and count >= limit:
                break

    finally:
        doc.close()

    logger.info(f"Extracted {len(images)} images from PDF")
    return images


def save_captions_to_json(
    captions: list[dict[str, Any]],
    output_path: str,
) -> None:
    """キャプションをJSONファイルに保存

    Args:
        captions: キャプションデータのリスト
        output_path: 出力ファイルパス
    """
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(captions, f, ensure_ascii=False, indent=2)

    logger.info(f"Saved {len(captions)} captions to {output_path}")


def generate_captions(
    pdf_path: str,
    output_path: Optional[str] = None,
    limit: Optional[int] = None,
    skip_model_load: bool = False,
    save_images: bool = False,
    images_dir: Optional[str] = None,
) -> list[dict[str, Any]]:
    """PDFから画像を抽出しキャプションを生成

    Args:
        pdf_path: PDFファイルパス
        output_path: JSON出力パス（オプション）
        limit: 処理する最大画像数
        skip_model_load: モデルロードをスキップ（テスト用）
        save_images: 画像をファイルに保存するか
        images_dir: 画像保存先ディレクトリ

    Returns:
        キャプションデータのリスト
    """
    # PDFを読み込み
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()

    # 画像を抽出
    images = extract_images_from_pdf(pdf_data, limit=limit)

    if not images:
        logger.warning("No images found in PDF")
        return []

    # モデルをロード（テスト時はスキップ可能）
    if skip_model_load:
        # テスト用：モックされたCaptionGeneratorを使用
        from unittest.mock import MagicMock
        generator = CaptionGenerator(
            model=MagicMock(),
            processor=MagicMock(),
        )
    else:
        generator = CaptionGenerator.load()

    # キャプション生成
    captions: list[dict[str, Any]] = []
    for i, img_data in enumerate(images):
        logger.info(f"Processing image {i + 1}/{len(images)}...")

        result = generator.generate_caption(
            image=img_data["image"],
            page_number=img_data["page"],
            xref=img_data["xref"],
        )

        if result:
            # 画像保存用にデータを追加
            if save_images and images_dir:
                result["image_data"] = img_data.get("image_data")

            captions.append(result)

    # 画像をファイルに保存
    if save_images and images_dir:
        images_path = Path(images_dir)
        images_path.mkdir(parents=True, exist_ok=True)

        for caption in captions:
            if "image_data" in caption:
                img_path = images_path / f"page{caption['page']}_xref{caption['xref']}.png"
                with open(img_path, "wb") as f:
                    f.write(caption["image_data"])
                caption["image_path"] = str(img_path)
                del caption["image_data"]  # JSONに含めないため削除

    # JSONに保存
    if output_path:
        save_captions_to_json(captions, output_path)

    return captions


def main():
    """メインエントリポイント"""
    parser = argparse.ArgumentParser(
        description="PDF画像からキャプションを生成"
    )
    parser.add_argument(
        "--pdf",
        required=True,
        help="PDFファイルパス",
    )
    parser.add_argument(
        "--output",
        default="captions.json",
        help="出力JSONファイルパス",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="処理する最大画像数",
    )
    parser.add_argument(
        "--save-images",
        action="store_true",
        help="画像をファイルに保存する",
    )
    parser.add_argument(
        "--images-dir",
        default="extracted_images",
        help="画像保存先ディレクトリ",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="詳細ログを出力",
    )

    args = parser.parse_args()

    # ロギング設定
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )

    # キャプション生成
    captions = generate_captions(
        pdf_path=args.pdf,
        output_path=args.output,
        limit=args.limit,
        save_images=args.save_images,
        images_dir=args.images_dir,
    )

    print(f"Generated {len(captions)} captions")
    print(f"Output saved to: {args.output}")


if __name__ == "__main__":
    main()
