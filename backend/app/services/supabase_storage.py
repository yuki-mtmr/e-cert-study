"""Supabase Storage サービス

Supabase Storageを使った画像保存管理サービス
"""
import logging
import uuid
from dataclasses import dataclass
from typing import Optional

from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseStorageError(Exception):
    """Supabase Storage エラー"""
    pass


@dataclass
class ImageInfo:
    """画像情報

    Attributes:
        id: 画像ID
        question_id: 紐づく問題ID
        file_path: 公開URL
        position: 問題内での位置（順番）
        alt_text: 代替テキスト（VLM解析結果）
        image_type: 画像タイプ ('diagram', 'formula', 'graph')
    """
    id: uuid.UUID
    question_id: uuid.UUID
    file_path: str
    position: int
    alt_text: Optional[str] = None
    image_type: Optional[str] = None

    def to_dict(self) -> dict:
        """辞書に変換"""
        return {
            "id": str(self.id),
            "question_id": str(self.question_id),
            "file_path": self.file_path,
            "position": self.position,
            "alt_text": self.alt_text,
            "image_type": self.image_type,
        }


class SupabaseStorage:
    """Supabase Storage 画像管理クラス

    Supabase Storageへの画像保存を管理する。

    Attributes:
        bucket_name: バケット名
    """

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        bucket_name: str = "question-images",
    ):
        """
        Args:
            supabase_url: Supabase プロジェクトURL
            supabase_key: Supabase APIキー
            bucket_name: バケット名（デフォルト: question-images）
        """
        self.client: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = bucket_name

    def _detect_image_format(self, image_data: bytes) -> str:
        """画像フォーマットを検出

        Args:
            image_data: 画像バイナリデータ

        Returns:
            フォーマット名 ('png', 'jpeg', etc.)

        Raises:
            SupabaseStorageError: 不正な画像データ
        """
        if not image_data:
            raise SupabaseStorageError("Empty image data provided")

        # PNG
        if image_data[:8] == b'\x89PNG\r\n\x1a\n':
            return "png"

        # JPEG
        if image_data[:2] == b'\xff\xd8':
            return "jpeg"

        # GIF
        if image_data[:6] in (b'GIF87a', b'GIF89a'):
            return "gif"

        # WebP
        if image_data[:4] == b'RIFF' and len(image_data) > 12 and image_data[8:12] == b'WEBP':
            return "webp"

        raise SupabaseStorageError("Invalid image data: unsupported format")

    def _get_content_type(self, img_format: str) -> str:
        """画像フォーマットからContent-Typeを取得"""
        content_types = {
            "png": "image/png",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "webp": "image/webp",
        }
        return content_types.get(img_format, "application/octet-stream")

    def save(
        self,
        image_data: bytes,
        question_id: uuid.UUID,
        position: int,
        alt_text: Optional[str] = None,
        image_type: Optional[str] = None,
    ) -> ImageInfo:
        """画像を保存する

        Args:
            image_data: 画像バイナリデータ
            question_id: 紐づく問題ID
            position: 問題内での位置
            alt_text: 代替テキスト
            image_type: 画像タイプ

        Returns:
            保存された画像の情報

        Raises:
            SupabaseStorageError: 保存に失敗した場合
        """
        # フォーマット検出
        img_format = self._detect_image_format(image_data)
        content_type = self._get_content_type(img_format)

        # ファイル名生成
        image_id = uuid.uuid4()
        filename = f"{question_id}/{position:03d}_{image_id}.{img_format}"

        try:
            # Supabase Storageにアップロード
            storage = self.client.storage.from_(self.bucket_name)
            storage.upload(
                path=filename,
                file=image_data,
                file_options={"content-type": content_type}
            )

            # 公開URLを取得
            public_url = storage.get_public_url(filename)

            logger.info(f"Saved image to Supabase: {filename}")

            return ImageInfo(
                id=image_id,
                question_id=question_id,
                file_path=public_url,
                position=position,
                alt_text=alt_text,
                image_type=image_type,
            )
        except Exception as e:
            raise SupabaseStorageError(f"Failed to save image: {e}") from e

    def get_url(self, path: str) -> str:
        """画像の公開URLを取得

        Args:
            path: ストレージ内のパス

        Returns:
            公開URL
        """
        storage = self.client.storage.from_(self.bucket_name)
        return storage.get_public_url(path)

    def delete(self, path: str) -> bool:
        """画像を削除する

        Args:
            path: 削除する画像のパス

        Returns:
            削除成功ならTrue
        """
        try:
            storage = self.client.storage.from_(self.bucket_name)
            storage.remove([path])
            logger.info(f"Deleted image from Supabase: {path}")
            return True
        except Exception as e:
            logger.warning(f"Failed to delete image from Supabase: {e}")
            return False

    def list_images(self, question_id: uuid.UUID) -> list[ImageInfo]:
        """問題に紐づく画像一覧を取得

        Args:
            question_id: 問題ID

        Returns:
            画像情報のリスト
        """
        try:
            storage = self.client.storage.from_(self.bucket_name)
            files = storage.list(path=str(question_id))

            images = []
            for file_info in files:
                name = file_info.get("name", "")
                if any(name.lower().endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".gif", ".webp")):
                    try:
                        position = int(name.split("_")[0])
                    except (ValueError, IndexError):
                        position = 0

                    path = f"{question_id}/{name}"
                    public_url = storage.get_public_url(path)

                    images.append(ImageInfo(
                        id=uuid.uuid4(),
                        question_id=question_id,
                        file_path=public_url,
                        position=position,
                    ))

            return sorted(images, key=lambda x: x.position)
        except Exception as e:
            logger.warning(f"Failed to list images: {e}")
            return []


# グローバルストレージインスタンス
_storage: Optional[SupabaseStorage] = None


def _get_storage() -> SupabaseStorage:
    """ストレージインスタンスを取得"""
    global _storage
    if _storage is None:
        from app.core.config import settings
        _storage = SupabaseStorage(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_key,
            bucket_name=settings.supabase_bucket_name,
        )
    return _storage


def save_image_to_supabase(
    image_data: bytes,
    question_id: uuid.UUID,
    position: int,
    alt_text: Optional[str] = None,
    image_type: Optional[str] = None,
) -> ImageInfo:
    """画像をSupabase Storageに保存するヘルパー関数

    Args:
        image_data: 画像バイナリデータ
        question_id: 紐づく問題ID
        position: 問題内での位置
        alt_text: 代替テキスト
        image_type: 画像タイプ

    Returns:
        保存された画像の情報
    """
    storage = _get_storage()
    return storage.save(
        image_data=image_data,
        question_id=question_id,
        position=position,
        alt_text=alt_text,
        image_type=image_type,
    )


def get_image_url(path: str) -> str:
    """画像の公開URLを取得するヘルパー関数

    Args:
        path: ストレージ内のパス

    Returns:
        公開URL
    """
    storage = _get_storage()
    return storage.get_url(path)


def delete_image_from_supabase(path: str) -> bool:
    """画像を削除するヘルパー関数

    Args:
        path: 削除する画像のパス

    Returns:
        削除成功ならTrue
    """
    storage = _get_storage()
    return storage.delete(path)
