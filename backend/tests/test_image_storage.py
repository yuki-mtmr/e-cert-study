"""Image Storage サービスのテスト

画像保存管理サービスのテスト
"""
import base64
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch

import pytest

from app.services.image_storage import (
    ImageStorage,
    ImageStorageError,
    ImageInfo,
    save_image,
    get_image_path,
    delete_image,
)


# テスト用の小さなPNG画像（1x1ピクセル）
TEST_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
TEST_PNG_BYTES = base64.b64decode(TEST_PNG_BASE64)

# テスト用JPEG（最小の有効なJPEGファイル）
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


class TestImageStorage:
    """ImageStorageクラスのテスト"""

    @pytest.fixture
    def temp_storage_dir(self):
        """テスト用一時ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_storage_initialization(self, temp_storage_dir):
        """ストレージの初期化テスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        assert storage.base_path == Path(temp_storage_dir)

    def test_storage_default_path(self):
        """デフォルトパスのテスト"""
        storage = ImageStorage()
        assert "static/images" in str(storage.base_path)

    def test_save_image_png(self, temp_storage_dir):
        """PNG画像保存のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        info = storage.save(
            image_data=TEST_PNG_BYTES,
            question_id=question_id,
            position=0,
        )

        assert isinstance(info, ImageInfo)
        assert info.question_id == question_id
        assert info.position == 0
        assert info.file_path.endswith(".png")
        assert Path(info.file_path).exists()

    def test_save_image_jpeg(self, temp_storage_dir):
        """JPEG画像保存のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        info = storage.save(
            image_data=TEST_JPEG_BYTES,
            question_id=question_id,
            position=1,
        )

        assert isinstance(info, ImageInfo)
        assert info.file_path.endswith((".jpg", ".jpeg"))

    def test_save_image_with_metadata(self, temp_storage_dir):
        """メタデータ付き画像保存のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
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

    def test_save_multiple_images(self, temp_storage_dir):
        """複数画像保存のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        infos = []
        for i in range(3):
            info = storage.save(
                image_data=TEST_PNG_BYTES,
                question_id=question_id,
                position=i,
            )
            infos.append(info)

        assert len(infos) == 3
        assert all(info.position == i for i, info in enumerate(infos))

        # 全て異なるファイルパス
        paths = [info.file_path for info in infos]
        assert len(set(paths)) == 3

    def test_get_image_path(self, temp_storage_dir):
        """画像パス取得のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        info = storage.save(
            image_data=TEST_PNG_BYTES,
            question_id=question_id,
            position=0,
        )

        retrieved_path = storage.get_path(info.file_path)
        assert retrieved_path == info.file_path
        assert Path(retrieved_path).exists()

    def test_delete_image(self, temp_storage_dir):
        """画像削除のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        info = storage.save(
            image_data=TEST_PNG_BYTES,
            question_id=question_id,
            position=0,
        )

        assert Path(info.file_path).exists()

        result = storage.delete(info.file_path)
        assert result is True
        assert not Path(info.file_path).exists()

    def test_delete_nonexistent_image(self, temp_storage_dir):
        """存在しない画像の削除テスト"""
        storage = ImageStorage(base_path=temp_storage_dir)

        result = storage.delete("/nonexistent/path.png")
        assert result is False

    def test_invalid_image_data(self, temp_storage_dir):
        """無効な画像データのテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        with pytest.raises(ImageStorageError) as exc_info:
            storage.save(
                image_data=b"not an image",
                question_id=question_id,
                position=0,
            )

        assert "invalid" in str(exc_info.value).lower()

    def test_empty_image_data(self, temp_storage_dir):
        """空の画像データのテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)
        question_id = uuid.uuid4()

        with pytest.raises(ImageStorageError) as exc_info:
            storage.save(
                image_data=b"",
                question_id=question_id,
                position=0,
            )

        assert "empty" in str(exc_info.value).lower()


class TestImageInfo:
    """ImageInfoのテスト"""

    def test_info_creation(self):
        """ImageInfo作成のテスト"""
        question_id = uuid.uuid4()
        info = ImageInfo(
            id=uuid.uuid4(),
            question_id=question_id,
            file_path="/path/to/image.png",
            alt_text="Test image",
            position=0,
            image_type="diagram",
        )

        assert info.question_id == question_id
        assert info.file_path == "/path/to/image.png"
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
            file_path="/path/to/image.png",
            alt_text="Test image",
            position=0,
            image_type="diagram",
        )

        result = info.to_dict()
        assert result["id"] == str(image_id)
        assert result["question_id"] == str(question_id)
        assert result["file_path"] == "/path/to/image.png"

    def test_info_optional_fields(self):
        """オプショナルフィールドのテスト"""
        info = ImageInfo(
            id=uuid.uuid4(),
            question_id=uuid.uuid4(),
            file_path="/path/to/image.png",
            position=0,
        )

        assert info.alt_text is None
        assert info.image_type is None


class TestHelperFunctions:
    """ヘルパー関数のテスト"""

    @pytest.fixture
    def temp_storage_dir(self):
        """テスト用一時ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_save_image_function(self, temp_storage_dir):
        """save_image関数のテスト"""
        question_id = uuid.uuid4()

        with patch("app.services.image_storage.ImageStorage") as MockStorage:
            mock_storage = MockStorage.return_value
            mock_storage.save.return_value = ImageInfo(
                id=uuid.uuid4(),
                question_id=question_id,
                file_path=f"{temp_storage_dir}/test.png",
                position=0,
            )

            info = save_image(
                image_data=TEST_PNG_BYTES,
                question_id=question_id,
                position=0,
            )

            assert info is not None

    def test_get_image_path_function(self, temp_storage_dir):
        """get_image_path関数のテスト"""
        # 直接ストレージを使ってテスト
        from app.services import image_storage
        original_storage = image_storage._storage
        try:
            image_storage._storage = ImageStorage(base_path=temp_storage_dir)
            path = get_image_path(f"{temp_storage_dir}/test.png")
            assert path == f"{temp_storage_dir}/test.png"
        finally:
            image_storage._storage = original_storage

    def test_delete_image_function(self, temp_storage_dir):
        """delete_image関数のテスト"""
        # 直接ストレージを使ってテスト
        from app.services import image_storage
        original_storage = image_storage._storage
        try:
            image_storage._storage = ImageStorage(base_path=temp_storage_dir)
            # 存在しないファイルを削除 -> False
            result = delete_image(f"{temp_storage_dir}/nonexistent.png")
            assert result is False
        finally:
            image_storage._storage = original_storage


class TestImageTypeDetection:
    """画像タイプ自動検出のテスト"""

    @pytest.fixture
    def temp_storage_dir(self):
        """テスト用一時ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)

    def test_detect_png(self, temp_storage_dir):
        """PNGファイル検出のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)

        detected_type = storage._detect_image_format(TEST_PNG_BYTES)
        assert detected_type == "png"

    def test_detect_jpeg(self, temp_storage_dir):
        """JPEGファイル検出のテスト"""
        storage = ImageStorage(base_path=temp_storage_dir)

        detected_type = storage._detect_image_format(TEST_JPEG_BYTES)
        assert detected_type in ("jpeg", "jpg")
