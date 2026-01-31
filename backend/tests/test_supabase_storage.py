"""Supabase Storage サービスのテスト

Supabase Storageを使った画像保存管理サービスのテスト
"""
import base64
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.supabase_storage import (
    SupabaseStorage,
    SupabaseStorageError,
    ImageInfo,
    save_image_to_supabase,
    get_image_url,
    delete_image_from_supabase,
)


# テスト用の小さなPNG画像（1x1ピクセル）
TEST_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
TEST_PNG_BYTES = base64.b64decode(TEST_PNG_BASE64)

# テスト用JPEG
TEST_JPEG_BYTES = bytes([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0xFF, 0xD9
])


class TestSupabaseStorage:
    """SupabaseStorageクラスのテスト"""

    @pytest.fixture
    def mock_supabase_client(self):
        """モックSupabaseクライアント"""
        mock_client = MagicMock()
        mock_storage = MagicMock()
        mock_client.storage.from_.return_value = mock_storage
        return mock_client, mock_storage

    def test_storage_initialization(self, mock_supabase_client):
        """ストレージの初期化テスト"""
        mock_client, _ = mock_supabase_client
        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            assert storage.bucket_name == "images"

    def test_save_image_png(self, mock_supabase_client):
        """PNG画像保存のテスト"""
        mock_client, mock_storage = mock_supabase_client
        mock_storage.upload.return_value = MagicMock(status_code=200)
        mock_storage.get_public_url.return_value = "https://test.supabase.co/storage/v1/object/public/images/test.png"

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            question_id = uuid.uuid4()

            info = storage.save(
                image_data=TEST_PNG_BYTES,
                question_id=question_id,
                position=0,
            )

            assert isinstance(info, ImageInfo)
            assert info.question_id == question_id
            assert info.position == 0
            assert "supabase.co" in info.file_path
            mock_storage.upload.assert_called_once()

    def test_save_image_with_metadata(self, mock_supabase_client):
        """メタデータ付き画像保存のテスト"""
        mock_client, mock_storage = mock_supabase_client
        mock_storage.upload.return_value = MagicMock(status_code=200)
        mock_storage.get_public_url.return_value = "https://test.supabase.co/storage/v1/object/public/images/test.png"

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            question_id = uuid.uuid4()

            info = storage.save(
                image_data=TEST_PNG_BYTES,
                question_id=question_id,
                position=0,
                alt_text="A neural network diagram",
                image_type="diagram",
            )

            assert info.alt_text == "A neural network diagram"
            assert info.image_type == "diagram"

    def test_get_public_url(self, mock_supabase_client):
        """公開URL取得のテスト"""
        mock_client, mock_storage = mock_supabase_client
        expected_url = "https://test.supabase.co/storage/v1/object/public/images/test.png"
        mock_storage.get_public_url.return_value = expected_url

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )

            url = storage.get_url("test.png")
            assert url == expected_url

    def test_delete_image(self, mock_supabase_client):
        """画像削除のテスト"""
        mock_client, mock_storage = mock_supabase_client
        mock_storage.remove.return_value = MagicMock(status_code=200)

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )

            result = storage.delete("question_id/image.png")
            assert result is True
            mock_storage.remove.assert_called_once()

    def test_invalid_image_data(self, mock_supabase_client):
        """無効な画像データのテスト"""
        mock_client, _ = mock_supabase_client

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            question_id = uuid.uuid4()

            with pytest.raises(SupabaseStorageError) as exc_info:
                storage.save(
                    image_data=b"not an image",
                    question_id=question_id,
                    position=0,
                )

            assert "invalid" in str(exc_info.value).lower()

    def test_empty_image_data(self, mock_supabase_client):
        """空の画像データのテスト"""
        mock_client, _ = mock_supabase_client

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            question_id = uuid.uuid4()

            with pytest.raises(SupabaseStorageError) as exc_info:
                storage.save(
                    image_data=b"",
                    question_id=question_id,
                    position=0,
                )

            assert "empty" in str(exc_info.value).lower()

    def test_upload_failure(self, mock_supabase_client):
        """アップロード失敗のテスト"""
        mock_client, mock_storage = mock_supabase_client
        mock_storage.upload.side_effect = Exception("Upload failed")

        with patch("app.services.supabase_storage.create_client", return_value=mock_client):
            storage = SupabaseStorage(
                supabase_url="https://test.supabase.co",
                supabase_key="test-key",
                bucket_name="images"
            )
            question_id = uuid.uuid4()

            with pytest.raises(SupabaseStorageError) as exc_info:
                storage.save(
                    image_data=TEST_PNG_BYTES,
                    question_id=question_id,
                    position=0,
                )

            assert "failed" in str(exc_info.value).lower()


class TestImageInfo:
    """ImageInfoのテスト"""

    def test_info_creation(self):
        """ImageInfo作成のテスト"""
        question_id = uuid.uuid4()
        info = ImageInfo(
            id=uuid.uuid4(),
            question_id=question_id,
            file_path="https://test.supabase.co/storage/v1/object/public/images/test.png",
            alt_text="Test image",
            position=0,
            image_type="diagram",
        )

        assert info.question_id == question_id
        assert "supabase.co" in info.file_path
        assert info.alt_text == "Test image"
        assert info.position == 0
        assert info.image_type == "diagram"

    def test_info_to_dict(self):
        """辞書変換のテスト"""
        question_id = uuid.uuid4()
        image_id = uuid.uuid4()
        info = ImageInfo(
            id=image_id,
            question_id=question_id,
            file_path="https://test.supabase.co/storage/v1/object/public/images/test.png",
            alt_text="Test image",
            position=0,
            image_type="diagram",
        )

        result = info.to_dict()
        assert result["id"] == str(image_id)
        assert result["question_id"] == str(question_id)
        assert "supabase.co" in result["file_path"]


class TestHelperFunctions:
    """ヘルパー関数のテスト"""

    def test_save_image_to_supabase_function(self):
        """save_image_to_supabase関数のテスト"""
        question_id = uuid.uuid4()
        mock_info = ImageInfo(
            id=uuid.uuid4(),
            question_id=question_id,
            file_path="https://test.supabase.co/storage/v1/object/public/images/test.png",
            position=0,
        )

        with patch("app.services.supabase_storage._get_storage") as mock_get_storage:
            mock_storage = MagicMock()
            mock_storage.save.return_value = mock_info
            mock_get_storage.return_value = mock_storage

            info = save_image_to_supabase(
                image_data=TEST_PNG_BYTES,
                question_id=question_id,
                position=0,
            )

            assert info is not None
            mock_storage.save.assert_called_once()

    def test_get_image_url_function(self):
        """get_image_url関数のテスト"""
        expected_url = "https://test.supabase.co/storage/v1/object/public/images/test.png"

        with patch("app.services.supabase_storage._get_storage") as mock_get_storage:
            mock_storage = MagicMock()
            mock_storage.get_url.return_value = expected_url
            mock_get_storage.return_value = mock_storage

            url = get_image_url("test.png")
            assert url == expected_url

    def test_delete_image_from_supabase_function(self):
        """delete_image_from_supabase関数のテスト"""
        with patch("app.services.supabase_storage._get_storage") as mock_get_storage:
            mock_storage = MagicMock()
            mock_storage.delete.return_value = True
            mock_get_storage.return_value = mock_storage

            result = delete_image_from_supabase("test.png")
            assert result is True
