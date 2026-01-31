"""Image Storage サービス

画像保存管理サービス
"""
import logging
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# デフォルト保存先
DEFAULT_STORAGE_PATH = Path(__file__).parent.parent.parent / "static" / "images"


class ImageStorageError(Exception):
    """画像保存エラー"""
    pass


@dataclass
class ImageInfo:
    """画像情報

    Attributes:
        id: 画像ID
        question_id: 紐づく問題ID
        file_path: ファイルパス
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


class ImageStorage:
    """画像保存管理クラス

    ローカルファイルシステムへの画像保存を管理する。

    Attributes:
        base_path: 保存先ベースディレクトリ
    """

    def __init__(self, base_path: Optional[str] = None):
        """
        Args:
            base_path: 保存先ベースディレクトリ（省略時はデフォルト）
        """
        if base_path:
            self.base_path = Path(base_path)
        else:
            self.base_path = DEFAULT_STORAGE_PATH

    def _ensure_directory(self, question_id: uuid.UUID) -> Path:
        """問題IDごとのディレクトリを作成

        Args:
            question_id: 問題ID

        Returns:
            ディレクトリパス
        """
        dir_path = self.base_path / str(question_id)
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path

    def _detect_image_format(self, image_data: bytes) -> str:
        """画像フォーマットを検出

        Args:
            image_data: 画像バイナリデータ

        Returns:
            フォーマット名 ('png', 'jpeg', etc.)

        Raises:
            ImageStorageError: 不正な画像データ
        """
        if not image_data:
            raise ImageStorageError("Empty image data provided")

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
        if image_data[:4] == b'RIFF' and image_data[8:12] == b'WEBP':
            return "webp"

        raise ImageStorageError("Invalid image data: unsupported format")

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
            ImageStorageError: 保存に失敗した場合
        """
        # フォーマット検出
        img_format = self._detect_image_format(image_data)

        # ディレクトリ作成
        dir_path = self._ensure_directory(question_id)

        # ファイル名生成
        image_id = uuid.uuid4()
        filename = f"{position:03d}_{image_id}.{img_format}"
        file_path = dir_path / filename

        try:
            with open(file_path, "wb") as f:
                f.write(image_data)

            logger.info(f"Saved image: {file_path}")

            return ImageInfo(
                id=image_id,
                question_id=question_id,
                file_path=str(file_path),
                position=position,
                alt_text=alt_text,
                image_type=image_type,
            )
        except OSError as e:
            raise ImageStorageError(f"Failed to save image: {e}") from e

    def get_path(self, file_path: str) -> str:
        """画像のフルパスを取得

        Args:
            file_path: 保存時のファイルパス

        Returns:
            フルパス
        """
        return file_path

    def delete(self, file_path: str) -> bool:
        """画像を削除する

        Args:
            file_path: 削除する画像のパス

        Returns:
            削除成功ならTrue
        """
        path = Path(file_path)
        if path.exists():
            try:
                path.unlink()
                logger.info(f"Deleted image: {file_path}")
                return True
            except OSError as e:
                logger.warning(f"Failed to delete image: {e}")
                return False
        return False

    def list_images(self, question_id: uuid.UUID) -> list[ImageInfo]:
        """問題に紐づく画像一覧を取得

        Args:
            question_id: 問題ID

        Returns:
            画像情報のリスト
        """
        dir_path = self.base_path / str(question_id)
        if not dir_path.exists():
            return []

        images = []
        for file_path in sorted(dir_path.glob("*")):
            if file_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
                # ファイル名から位置を解析（000_uuid.png形式）
                try:
                    position = int(file_path.stem.split("_")[0])
                except (ValueError, IndexError):
                    position = 0

                images.append(ImageInfo(
                    id=uuid.uuid4(),  # 再生成（DBから取得すべき）
                    question_id=question_id,
                    file_path=str(file_path),
                    position=position,
                ))

        return images


# グローバルストレージインスタンス
_storage: Optional[ImageStorage] = None


def _get_storage() -> ImageStorage:
    """ストレージインスタンスを取得"""
    global _storage
    if _storage is None:
        _storage = ImageStorage()
    return _storage


def save_image(
    image_data: bytes,
    question_id: uuid.UUID,
    position: int,
    alt_text: Optional[str] = None,
    image_type: Optional[str] = None,
) -> ImageInfo:
    """画像を保存するヘルパー関数

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


def get_image_path(file_path: str) -> str:
    """画像のフルパスを取得するヘルパー関数

    Args:
        file_path: 保存時のファイルパス

    Returns:
        フルパス
    """
    storage = _get_storage()
    return storage.get_path(file_path)


def delete_image(file_path: str) -> bool:
    """画像を削除するヘルパー関数

    Args:
        file_path: 削除する画像のパス

    Returns:
        削除成功ならTrue
    """
    storage = _get_storage()
    return storage.delete(file_path)
