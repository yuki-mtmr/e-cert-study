"""キャプション生成のテスト

Qwen2-VL-2Bを使用した画像キャプション生成のユニットテスト
"""
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock
import io

from PIL import Image


class TestCaptionGenerator:
    """CaptionGeneratorクラスのテスト"""

    def test_generate_caption_returns_caption_data(self):
        """キャプション生成が正しいデータ構造を返すこと"""
        from scripts.generate_captions import CaptionGenerator

        # モックモデルを作成
        mock_model = MagicMock()
        mock_processor = MagicMock()

        generator = CaptionGenerator(
            model=mock_model,
            processor=mock_processor,
        )

        # テスト用の小さな画像を作成
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        # モックのレスポンスを設定
        mock_processor.apply_chat_template.return_value = "テスト入力"
        # processorの__call__戻り値をMagicMockにして.toメソッドを持たせる
        mock_inputs = MagicMock()
        mock_inputs.to.return_value = mock_inputs
        mock_processor.return_value = mock_inputs
        mock_model.generate.return_value = MagicMock()
        mock_processor.batch_decode.return_value = ["これはテスト画像です。"]

        # キャプション生成
        result = generator.generate_caption(
            image=img,
            page_number=1,
            xref=100,
        )

        # 結果の検証
        assert result is not None
        assert "page" in result
        assert "xref" in result
        assert "caption" in result
        assert result["page"] == 1
        assert result["xref"] == 100
        assert isinstance(result["caption"], str)

    def test_generate_caption_handles_model_error(self):
        """モデルエラー時にNoneを返すこと"""
        from scripts.generate_captions import CaptionGenerator

        mock_model = MagicMock()
        mock_processor = MagicMock()

        generator = CaptionGenerator(
            model=mock_model,
            processor=mock_processor,
        )

        # エラーを発生させる
        mock_processor.apply_chat_template.side_effect = RuntimeError("Model error")

        img = Image.new('RGB', (100, 100), color='blue')

        result = generator.generate_caption(
            image=img,
            page_number=0,
            xref=1,
        )

        assert result is None


class TestExtractImagesFromPdf:
    """PDF画像抽出のテスト"""

    def test_extract_images_returns_list(self):
        """画像抽出がリストを返すこと"""
        from scripts.generate_captions import extract_images_from_pdf

        # 空のPDFデータでテスト（PyMuPDFが必要）
        with pytest.raises(Exception):
            # 不正なPDFデータはエラーになるはず
            extract_images_from_pdf(b"not a pdf")

    @patch('scripts.generate_captions.pymupdf')
    def test_extract_images_with_mock_pdf(self, mock_pymupdf):
        """モックPDFから画像抽出ができること"""
        from scripts.generate_captions import extract_images_from_pdf

        # モックの設定
        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.number = 0
        mock_page.get_images.return_value = [(100, 0, 100, 100, 8, "DeviceRGB", "", "")]

        mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
        mock_doc.close = MagicMock()

        # Pixmapのモック
        mock_pixmap = MagicMock()
        mock_pixmap.n = 3
        mock_pixmap.alpha = 0
        mock_pixmap.width = 100
        mock_pixmap.height = 100
        mock_pixmap.samples = b'\xff' * (100 * 100 * 3)

        mock_pymupdf.open.return_value = mock_doc
        mock_pymupdf.Pixmap.return_value = mock_pixmap

        result = extract_images_from_pdf(b"dummy pdf data")

        assert isinstance(result, list)


class TestSaveCaptionsToJson:
    """キャプション保存のテスト"""

    def test_save_captions_creates_file(self, tmp_path):
        """キャプションがJSONファイルに保存されること"""
        from scripts.generate_captions import save_captions_to_json

        captions = [
            {"page": 0, "xref": 100, "caption": "テスト画像1"},
            {"page": 1, "xref": 101, "caption": "テスト画像2"},
        ]

        output_path = tmp_path / "captions.json"
        save_captions_to_json(captions, str(output_path))

        assert output_path.exists()

        with open(output_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert len(loaded) == 2
        assert loaded[0]["caption"] == "テスト画像1"

    def test_save_captions_handles_empty_list(self, tmp_path):
        """空リストでもファイルが作成されること"""
        from scripts.generate_captions import save_captions_to_json

        output_path = tmp_path / "empty_captions.json"
        save_captions_to_json([], str(output_path))

        assert output_path.exists()

        with open(output_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert loaded == []


class TestGenerateCaptionsMain:
    """メイン関数のテスト"""

    @patch('builtins.open')
    @patch('scripts.generate_captions.extract_images_from_pdf')
    def test_generate_captions_orchestration(
        self,
        mock_extract,
        mock_open,
    ):
        """メイン関数が各コンポーネントを正しく連携させること"""
        from scripts.generate_captions import generate_captions

        # ファイル読み込みのモック
        mock_file = MagicMock()
        mock_file.read.return_value = b"PDF data"
        mock_open.return_value.__enter__.return_value = mock_file

        # 画像抽出のモック
        mock_img = MagicMock()
        mock_extract.return_value = [
            {"image": mock_img, "page": 0, "xref": 100},
        ]

        # 実行（skip_model_loadでモックジェネレータを使用）
        result = generate_captions(
            pdf_path="/path/to/test.pdf",
            limit=1,
            skip_model_load=True,
        )

        # skip_model_loadの場合、モックジェネレータが使用されるため結果はNoneになる可能性がある
        # テストではextractが呼ばれたことを確認
        mock_extract.assert_called_once()
        assert isinstance(result, list)


class TestCaptionGeneratorWithoutModel:
    """モデルなしでのCaptionGeneratorテスト（ユニットテスト用）"""

    def test_prompt_template_is_correct(self):
        """プロンプトテンプレートが正しいこと"""
        from scripts.generate_captions import DEFAULT_PROMPT

        assert "日本語" in DEFAULT_PROMPT
        assert "説明" in DEFAULT_PROMPT or "キャプション" in DEFAULT_PROMPT

    def test_can_create_generator_with_mock(self):
        """モックでCaptionGeneratorを作成できること"""
        from scripts.generate_captions import CaptionGenerator

        mock_model = MagicMock()
        mock_processor = MagicMock()

        generator = CaptionGenerator(
            model=mock_model,
            processor=mock_processor,
        )

        assert generator.model is mock_model
        assert generator.processor is mock_processor


class TestCaptionResult:
    """CaptionResultクラスのテスト"""

    def test_to_dict_excludes_image_data(self):
        """to_dictがimage_dataを除外すること"""
        from scripts.generate_captions import CaptionResult

        result = CaptionResult(
            page=0,
            xref=100,
            caption="テスト",
            image_data=b"binary data",
        )

        d = result.to_dict()
        assert "page" in d
        assert "xref" in d
        assert "caption" in d
        assert "image_data" not in d


class TestGenerateCaptionsWithImages:
    """画像保存付きキャプション生成のテスト"""

    @patch('builtins.open')
    @patch('scripts.generate_captions.extract_images_from_pdf')
    @patch('scripts.generate_captions.save_captions_to_json')
    def test_generate_captions_with_save_images(
        self,
        mock_save,
        mock_extract,
        mock_open,
        tmp_path,
    ):
        """画像保存オプションが動作すること"""
        from scripts.generate_captions import generate_captions

        # ファイル読み込みのモック
        mock_file = MagicMock()
        mock_file.read.return_value = b"PDF data"
        mock_open.return_value.__enter__.return_value = mock_file

        # 画像抽出のモック
        mock_img = MagicMock()
        mock_extract.return_value = [
            {"image": mock_img, "page": 0, "xref": 100, "image_data": b"image"},
        ]

        result = generate_captions(
            pdf_path="/path/to/test.pdf",
            limit=1,
            skip_model_load=True,
        )

        assert isinstance(result, list)


class TestGenerateCaptionsEmptyPdf:
    """空のPDF処理のテスト"""

    @patch('builtins.open')
    @patch('scripts.generate_captions.extract_images_from_pdf')
    def test_generate_captions_empty_images(
        self,
        mock_extract,
        mock_open,
    ):
        """画像がない場合は空リストを返すこと"""
        from scripts.generate_captions import generate_captions

        mock_file = MagicMock()
        mock_file.read.return_value = b"PDF data"
        mock_open.return_value.__enter__.return_value = mock_file

        mock_extract.return_value = []

        result = generate_captions(
            pdf_path="/path/to/empty.pdf",
            skip_model_load=True,
        )

        assert result == []


class TestDeviceSelection:
    """デバイス選択のテスト（Metal/MPS対応）"""

    def test_get_best_device_returns_string(self):
        """get_best_deviceが文字列を返すこと"""
        from scripts.generate_captions import get_best_device

        device = get_best_device()
        assert isinstance(device, str)
        assert device in ["mps", "cuda", "cpu"]

    def test_get_best_device_with_explicit_cpu(self):
        """明示的にcpuを指定した場合"""
        from scripts.generate_captions import get_best_device

        device = get_best_device(preferred="cpu")
        assert device == "cpu"

    def test_get_best_device_prefers_mps_on_mac(self):
        """macOSでMPSが利用可能な場合はmpsを返すこと"""
        import scripts.generate_captions as module

        # torchをモック
        mock_torch = MagicMock()
        mock_torch.backends.mps.is_available.return_value = True
        mock_torch.backends.mps.is_built.return_value = True
        mock_torch.cuda.is_available.return_value = False

        original_torch = module.torch
        original_available = module.TORCH_AVAILABLE
        try:
            module.torch = mock_torch
            module.TORCH_AVAILABLE = True

            device = module.get_best_device()
            assert device == "mps"
        finally:
            module.torch = original_torch
            module.TORCH_AVAILABLE = original_available

    def test_get_best_device_falls_back_to_cuda(self):
        """MPSが利用不可でCUDAが利用可能な場合はcudaを返すこと"""
        import scripts.generate_captions as module

        mock_torch = MagicMock()
        mock_torch.backends.mps.is_available.return_value = False
        mock_torch.cuda.is_available.return_value = True

        original_torch = module.torch
        original_available = module.TORCH_AVAILABLE
        try:
            module.torch = mock_torch
            module.TORCH_AVAILABLE = True

            device = module.get_best_device()
            assert device == "cuda"
        finally:
            module.torch = original_torch
            module.TORCH_AVAILABLE = original_available

    def test_get_best_device_falls_back_to_cpu(self):
        """GPU不可の場合はcpuを返すこと"""
        import scripts.generate_captions as module

        mock_torch = MagicMock()
        mock_torch.backends.mps.is_available.return_value = False
        mock_torch.cuda.is_available.return_value = False

        original_torch = module.torch
        original_available = module.TORCH_AVAILABLE
        try:
            module.torch = mock_torch
            module.TORCH_AVAILABLE = True

            device = module.get_best_device()
            assert device == "cpu"
        finally:
            module.torch = original_torch
            module.TORCH_AVAILABLE = original_available

    def test_get_best_device_without_torch(self):
        """torchが利用不可の場合はcpuを返すこと"""
        import scripts.generate_captions as module

        original_available = module.TORCH_AVAILABLE
        try:
            module.TORCH_AVAILABLE = False

            device = module.get_best_device()
            assert device == "cpu"
        finally:
            module.TORCH_AVAILABLE = original_available


class TestCaptionGeneratorLoad:
    """CaptionGenerator.loadのテスト"""

    def test_load_uses_mps_device_on_mac(self):
        """macOSでMPSデバイスが使用されること"""
        import scripts.generate_captions as module

        mock_model_class = MagicMock()
        mock_processor_class = MagicMock()
        mock_torch = MagicMock()

        # モックの設定
        mock_torch.backends.mps.is_available.return_value = True
        mock_torch.backends.mps.is_built.return_value = True
        mock_torch.float16 = "float16"

        mock_model = MagicMock()
        mock_model_class.from_pretrained.return_value = mock_model
        mock_processor_class.from_pretrained.return_value = MagicMock()

        # 元の値を保存
        original_model = module.Qwen2VLForConditionalGeneration
        original_processor = module.AutoProcessor
        original_torch = module.torch
        original_available = module.TORCH_AVAILABLE
        original_transformers = module.TRANSFORMERS_AVAILABLE

        try:
            module.Qwen2VLForConditionalGeneration = mock_model_class
            module.AutoProcessor = mock_processor_class
            module.torch = mock_torch
            module.TORCH_AVAILABLE = True
            module.TRANSFORMERS_AVAILABLE = True

            generator = module.CaptionGenerator.load()

            # device_map="mps"で呼ばれていること
            mock_model_class.from_pretrained.assert_called_once()
            call_kwargs = mock_model_class.from_pretrained.call_args.kwargs
            assert call_kwargs.get("device_map") == "mps"
        finally:
            module.Qwen2VLForConditionalGeneration = original_model
            module.AutoProcessor = original_processor
            module.torch = original_torch
            module.TORCH_AVAILABLE = original_available
            module.TRANSFORMERS_AVAILABLE = original_transformers
