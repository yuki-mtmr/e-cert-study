"""ImageMatcherサービスのテスト"""
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestImageMatcherService:
    """ImageMatcherServiceクラスのテスト"""

    @pytest.mark.asyncio
    async def test_match_returns_dict(self):
        """matchメソッドが辞書を返すこと"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        questions = [
            {"id": str(uuid.uuid4()), "content": "ニューラルネットワークとは何ですか？"},
        ]
        captions = [
            {"xref": 100, "page": 0, "caption": "ニューラルネットワークの構造を示す図"},
        ]

        with patch.object(service, '_get_matcher') as mock_get_matcher:
            mock_matcher = MagicMock()
            mock_matcher.match.return_value = [
                {
                    "question_id": questions[0]["id"],
                    "image_xref": 100,
                    "image_page": 0,
                    "score": 0.85,
                    "caption": "ニューラルネットワークの構造を示す図",
                }
            ]
            mock_get_matcher.return_value = mock_matcher

            result = await service.match(questions, captions)

        assert isinstance(result, dict)
        assert questions[0]["id"] in result

    @pytest.mark.asyncio
    async def test_match_returns_empty_dict_for_empty_input(self):
        """空の入力で空の辞書を返すこと"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        result = await service.match([], [])

        assert result == {}

    @pytest.mark.asyncio
    async def test_match_groups_by_question_id(self):
        """結果が問題IDごとにグループ化されること"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        q1_id = str(uuid.uuid4())
        q2_id = str(uuid.uuid4())

        questions = [
            {"id": q1_id, "content": "質問1"},
            {"id": q2_id, "content": "質問2"},
        ]
        captions = [
            {"xref": 100, "page": 0, "caption": "画像1"},
            {"xref": 101, "page": 1, "caption": "画像2"},
        ]

        with patch.object(service, '_get_matcher') as mock_get_matcher:
            mock_matcher = MagicMock()
            mock_matcher.match.return_value = [
                {"question_id": q1_id, "image_xref": 100, "image_page": 0, "score": 0.8, "caption": "画像1"},
                {"question_id": q1_id, "image_xref": 101, "image_page": 1, "score": 0.7, "caption": "画像2"},
                {"question_id": q2_id, "image_xref": 100, "image_page": 0, "score": 0.6, "caption": "画像1"},
            ]
            mock_get_matcher.return_value = mock_matcher

            result = await service.match(questions, captions)

        # q1には2つの画像がマッチ
        assert len(result[q1_id]) == 2
        # q2には1つの画像がマッチ
        assert len(result[q2_id]) == 1

    @pytest.mark.asyncio
    async def test_match_respects_threshold(self):
        """閾値が尊重されること"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        questions = [{"id": "q1", "content": "質問1"}]
        captions = [{"xref": 100, "page": 0, "caption": "画像1"}]

        with patch.object(service, '_get_matcher') as mock_get_matcher:
            mock_matcher = MagicMock()
            mock_matcher.match.return_value = []
            mock_get_matcher.return_value = mock_matcher

            result = await service.match(questions, captions, threshold=0.5)

            # matcherに閾値が渡されていること
            mock_matcher.match.assert_called_once()
            call_kwargs = mock_matcher.match.call_args.kwargs
            assert call_kwargs.get("threshold") == 0.5


class TestCaptionGeneratorService:
    """CaptionGeneratorServiceクラスのテスト"""

    @pytest.mark.asyncio
    async def test_generate_returns_list(self):
        """generateメソッドがリストを返すこと"""
        from app.services.caption_generator import CaptionGeneratorService

        service = CaptionGeneratorService()

        # 空のPDFデータでテスト
        result = await service.generate(images=[], skip_model_load=True)

        assert isinstance(result, list)
        assert result == []

    @pytest.mark.asyncio
    async def test_generate_with_images(self):
        """画像がある場合にキャプションを生成すること"""
        from app.services.caption_generator import CaptionGeneratorService
        from PIL import Image

        service = CaptionGeneratorService()

        # テスト用画像
        test_image = Image.new('RGB', (100, 100), color='red')
        images = [
            {"image": test_image, "page": 0, "xref": 100},
        ]

        with patch.object(service, '_get_generator') as mock_get_generator:
            mock_generator = MagicMock()
            mock_generator.generate_caption.return_value = {
                "page": 0,
                "xref": 100,
                "caption": "テスト画像",
            }
            mock_get_generator.return_value = mock_generator

            # skip_model_load=Falseで実際にモックを使用
            result = await service.generate(images=images, skip_model_load=False)

        assert len(result) == 1
        assert result[0]["caption"] == "テスト画像"

    @pytest.mark.asyncio
    async def test_generate_handles_exception(self):
        """エラー発生時に処理を継続すること"""
        from app.services.caption_generator import CaptionGeneratorService
        from PIL import Image

        service = CaptionGeneratorService()

        test_image = Image.new('RGB', (100, 100), color='red')
        images = [
            {"image": test_image, "page": 0, "xref": 100},
            {"image": test_image, "page": 1, "xref": 101},
        ]

        with patch.object(service, '_get_generator') as mock_get_generator:
            mock_generator = MagicMock()
            # 1つ目はエラー、2つ目は成功
            mock_generator.generate_caption.side_effect = [
                Exception("Model error"),
                {"page": 1, "xref": 101, "caption": "成功した画像"},
            ]
            mock_get_generator.return_value = mock_generator

            result = await service.generate(images=images, skip_model_load=False)

        # エラーが発生しても残りの画像は処理される
        assert len(result) == 1
        assert result[0]["caption"] == "成功した画像"


class TestImageMatcherServiceGetMatcher:
    """_get_matcherメソッドのテスト"""

    def test_get_matcher_lazy_loads(self):
        """マッチャーが遅延ロードされること"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        # 初期状態ではNone
        assert service._matcher is None

    def test_get_matcher_with_custom_model(self):
        """カスタムモデル名でマッチャーを作成できること"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService(model_name="custom-model")

        assert service.model_name == "custom-model"

    def test_get_matcher_loads_matcher(self):
        """_get_matcherがImageMatcherをロードすること"""
        pytest.importorskip("numpy", reason="numpy required for match_images")
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        with patch('scripts.match_images.ImageMatcher') as mock_matcher_class:
            mock_matcher = MagicMock()
            mock_matcher_class.load.return_value = mock_matcher

            result = service._get_matcher()

            mock_matcher_class.load.assert_called_once()
            assert result is mock_matcher

    def test_get_matcher_loads_with_custom_model(self):
        """_get_matcherがカスタムモデル名でロードすること"""
        pytest.importorskip("numpy", reason="numpy required for match_images")
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService(model_name="custom-model")

        with patch('scripts.match_images.ImageMatcher') as mock_matcher_class:
            mock_matcher = MagicMock()
            mock_matcher_class.load.return_value = mock_matcher

            result = service._get_matcher()

            mock_matcher_class.load.assert_called_once_with(model_name="custom-model")
            assert result is mock_matcher

    def test_get_matcher_caches_instance(self):
        """_get_matcherがインスタンスをキャッシュすること"""
        pytest.importorskip("numpy", reason="numpy required for match_images")
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        with patch('scripts.match_images.ImageMatcher') as mock_matcher_class:
            mock_matcher = MagicMock()
            mock_matcher_class.load.return_value = mock_matcher

            # 2回呼び出し
            result1 = service._get_matcher()
            result2 = service._get_matcher()

            # loadは1回だけ呼ばれる
            mock_matcher_class.load.assert_called_once()
            assert result1 is result2


class TestCaptionGeneratorServiceDevice:
    """デバイス指定のテスト"""

    def test_generator_with_custom_device(self):
        """カスタムデバイスを指定できること"""
        from app.services.caption_generator import CaptionGeneratorService

        service = CaptionGeneratorService(device="cpu")
        assert service.device == "cpu"

    @pytest.mark.asyncio
    async def test_generate_single_with_mock(self):
        """単一画像のキャプション生成テスト"""
        from app.services.caption_generator import CaptionGeneratorService
        from PIL import Image

        service = CaptionGeneratorService()

        test_image = Image.new('RGB', (100, 100), color='red')

        with patch.object(service, '_get_generator') as mock_get_generator:
            mock_generator = MagicMock()
            mock_generator.generate_caption.return_value = {
                "page": 0,
                "xref": 100,
                "caption": "テスト画像",
            }
            mock_get_generator.return_value = mock_generator

            result = await service.generate_single(
                image=test_image,
                page=0,
                xref=100,
            )

        assert result is not None
        assert result["caption"] == "テスト画像"

    @pytest.mark.asyncio
    async def test_generate_single_handles_error(self):
        """単一画像生成でエラーが発生した場合Noneを返すこと"""
        from app.services.caption_generator import CaptionGeneratorService
        from PIL import Image

        service = CaptionGeneratorService()

        test_image = Image.new('RGB', (100, 100), color='red')

        with patch.object(service, '_get_generator') as mock_get_generator:
            mock_generator = MagicMock()
            mock_generator.generate_caption.side_effect = Exception("Error")
            mock_get_generator.return_value = mock_generator

            result = await service.generate_single(
                image=test_image,
                page=0,
                xref=100,
            )

        assert result is None


class TestImageMatcherFromPdf:
    """match_from_pdfメソッドのテスト"""

    @pytest.mark.asyncio
    async def test_match_from_pdf_with_no_captions(self):
        """キャプションが生成されなかった場合は空の辞書を返すこと"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        questions = [{"id": "q1", "content": "質問1"}]

        with patch(
            'app.services.caption_generator.CaptionGeneratorService'
        ) as mock_caption_service_class:
            mock_caption_service = MagicMock()
            mock_caption_service.generate_from_pdf = AsyncMock(return_value=[])
            mock_caption_service_class.return_value = mock_caption_service

            result = await service.match_from_pdf(
                questions=questions,
                pdf_data=b"dummy pdf data",
            )

        assert result == {}

    @pytest.mark.asyncio
    async def test_match_from_pdf_success(self):
        """PDFから正常にマッチングできること"""
        from app.services.image_matcher import ImageMatcherService

        service = ImageMatcherService()

        q1_id = str(uuid.uuid4())
        questions = [{"id": q1_id, "content": "質問1"}]

        with patch(
            'app.services.caption_generator.CaptionGeneratorService'
        ) as mock_caption_service_class:
            mock_caption_service = MagicMock()
            mock_caption_service.generate_from_pdf = AsyncMock(return_value=[
                {"xref": 100, "page": 0, "caption": "画像キャプション"},
            ])
            mock_caption_service_class.return_value = mock_caption_service

            with patch.object(service, '_get_matcher') as mock_get_matcher:
                mock_matcher = MagicMock()
                mock_matcher.match.return_value = [
                    {
                        "question_id": q1_id,
                        "image_xref": 100,
                        "image_page": 0,
                        "score": 0.8,
                        "caption": "画像キャプション",
                    }
                ]
                mock_get_matcher.return_value = mock_matcher

                result = await service.match_from_pdf(
                    questions=questions,
                    pdf_data=b"dummy pdf data",
                )

        assert q1_id in result
        assert len(result[q1_id]) == 1


class TestCaptionGeneratorFromPdf:
    """generate_from_pdfメソッドのテスト"""

    @pytest.mark.asyncio
    async def test_generate_from_pdf_no_images(self):
        """画像がなければ空のリストを返すこと"""
        from app.services.caption_generator import CaptionGeneratorService

        service = CaptionGeneratorService()

        with patch(
            'scripts.generate_captions.extract_images_from_pdf'
        ) as mock_extract:
            mock_extract.return_value = []

            result = await service.generate_from_pdf(pdf_data=b"dummy pdf")

        assert result == []

    @pytest.mark.asyncio
    async def test_generate_from_pdf_with_images(self):
        """PDFから画像を抽出してキャプションを生成すること"""
        from app.services.caption_generator import CaptionGeneratorService
        from PIL import Image

        service = CaptionGeneratorService()

        mock_image = Image.new('RGB', (100, 100), color='red')

        with patch(
            'scripts.generate_captions.extract_images_from_pdf'
        ) as mock_extract:
            mock_extract.return_value = [
                {"image": mock_image, "page": 0, "xref": 100},
            ]

            with patch.object(service, '_get_generator') as mock_get_generator:
                mock_generator = MagicMock()
                mock_generator.generate_caption.return_value = {
                    "page": 0,
                    "xref": 100,
                    "caption": "テスト画像",
                }
                mock_get_generator.return_value = mock_generator

                result = await service.generate_from_pdf(pdf_data=b"dummy pdf")

        assert len(result) == 1
        assert result[0]["caption"] == "テスト画像"

    @pytest.mark.asyncio
    async def test_generate_from_pdf_with_limit(self):
        """limitパラメータが渡されること"""
        from app.services.caption_generator import CaptionGeneratorService

        service = CaptionGeneratorService()

        with patch(
            'scripts.generate_captions.extract_images_from_pdf'
        ) as mock_extract:
            mock_extract.return_value = []

            await service.generate_from_pdf(pdf_data=b"dummy pdf", limit=5)

            mock_extract.assert_called_once_with(b"dummy pdf", limit=5)
