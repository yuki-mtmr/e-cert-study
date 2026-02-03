"""問題-画像紐付け更新スクリプト

マッチング結果に基づいて問題と画像をDBに紐付ける。

使用方法:
    python -m scripts.update_question_images --matches matches.json --images-dir extracted_images
"""
import argparse
import asyncio
import json
import logging
import shutil
import uuid
from pathlib import Path
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

logger = logging.getLogger(__name__)

# デフォルトのデータベースURL
DEFAULT_DB_URL = "postgresql+asyncpg://user:pass@localhost:5432/e_cert_study"


async def get_async_session(db_url: str = DEFAULT_DB_URL) -> AsyncSession:
    """非同期セッションを取得

    Args:
        db_url: データベースURL

    Returns:
        AsyncSessionのコンテキストマネージャー
    """
    engine = create_async_engine(db_url)
    async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
    return async_session_maker()


def copy_image_to_static(
    source_path: Path,
    static_dir: Path,
    filename: str,
) -> Path:
    """画像ファイルをstaticディレクトリにコピー

    Args:
        source_path: コピー元ファイルパス
        static_dir: コピー先ディレクトリ
        filename: 保存時のファイル名

    Returns:
        コピー先のPath
    """
    # ディレクトリが存在しない場合は作成
    static_dir.mkdir(parents=True, exist_ok=True)

    dest_path = static_dir / filename
    shutil.copy2(source_path, dest_path)

    logger.debug(f"Copied image: {source_path} -> {dest_path}")
    return dest_path


async def create_question_image(
    session: AsyncSession,
    question_id: uuid.UUID,
    file_path: str,
    alt_text: Optional[str] = None,
    position: int = 0,
    image_type: Optional[str] = None,
) -> "QuestionImage":
    """QuestionImageレコードを作成

    Args:
        session: データベースセッション
        question_id: 問題ID
        file_path: 画像ファイルパス（相対パス）
        alt_text: 代替テキスト（キャプション）
        position: 表示順序
        image_type: 画像タイプ（figure, equation, etc.）

    Returns:
        作成されたQuestionImageインスタンス
    """
    from app.models.question_image import QuestionImage

    question_image = QuestionImage(
        question_id=question_id,
        file_path=file_path,
        alt_text=alt_text,
        position=position,
        image_type=image_type,
    )
    session.add(question_image)

    return question_image


async def update_question_images(
    matches_path: str,
    images_dir: str,
    db_url: Optional[str] = None,
    static_dir: Optional[str] = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    """マッチング結果に基づいて問題-画像を紐付け

    Args:
        matches_path: マッチングJSONファイルパス
        images_dir: 画像ディレクトリパス
        db_url: データベースURL（オプション）
        static_dir: 静的ファイルディレクトリ（オプション）
        dry_run: 実際に更新せずにログのみ出力

    Returns:
        更新結果のサマリー
    """
    # マッチングデータを読み込み
    with open(matches_path, "r", encoding="utf-8") as f:
        matches = json.load(f)

    logger.info(f"Loaded {len(matches)} matches from {matches_path}")

    images_path = Path(images_dir)
    if not images_path.exists():
        logger.warning(f"Images directory not found: {images_dir}")
        return {"error": "Images directory not found", "updated": 0}

    # 結果サマリー
    summary: dict[str, Any] = {
        "total_matches": len(matches),
        "images_found": 0,
        "images_missing": 0,
        "updated": 0,
        "errors": 0,
    }

    if dry_run:
        logger.info("DRY RUN - No actual updates will be made")

    # 静的ファイルディレクトリ
    static_path = Path(static_dir) if static_dir else Path("static/images")

    # 問題ごとの画像カウンター（position計算用）
    question_image_count: dict[str, int] = {}

    for match in matches:
        question_id = match.get("question_id")
        image_xref = match.get("image_xref")
        image_page = match.get("image_page", 0)
        caption = match.get("caption", "")

        # 画像ファイルを探す
        image_filename = f"page{image_page}_xref{image_xref}.png"
        image_file = images_path / image_filename

        if not image_file.exists():
            # 別の命名規則を試す
            alt_filename = f"image_{image_xref}.png"
            image_file = images_path / alt_filename

        if image_file.exists():
            summary["images_found"] += 1
            logger.debug(f"Found image: {image_file} for question {question_id}")

            if not dry_run:
                try:
                    # 画像をstaticディレクトリにコピー
                    new_filename = f"{question_id}_{image_xref}.png"
                    dest_path = copy_image_to_static(
                        source_path=image_file,
                        static_dir=static_path,
                        filename=new_filename,
                    )

                    # DB更新
                    db_url_to_use = db_url or DEFAULT_DB_URL
                    session = await get_async_session(db_url_to_use)

                    async with session:
                        # position計算
                        position = question_image_count.get(question_id, 0)
                        question_image_count[question_id] = position + 1

                        await create_question_image(
                            session=session,
                            question_id=uuid.UUID(question_id),
                            file_path=f"images/{new_filename}",
                            alt_text=caption,
                            position=position,
                            image_type="figure",
                        )

                        await session.commit()

                    summary["updated"] += 1
                    logger.info(f"Updated question {question_id} with image {new_filename}")

                except Exception as e:
                    logger.error(f"Failed to update question {question_id}: {e}")
                    summary["errors"] += 1
        else:
            summary["images_missing"] += 1
            logger.warning(f"Image not found: {image_filename} for question {question_id}")

    logger.info(f"Summary: {summary}")
    return summary


def load_matches_from_json(path: str) -> list[dict[str, Any]]:
    """JSONファイルからマッチングデータを読み込む

    Args:
        path: JSONファイルパス

    Returns:
        マッチングデータのリスト
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    """メインエントリポイント"""
    parser = argparse.ArgumentParser(
        description="マッチング結果に基づいて問題-画像を紐付け"
    )
    parser.add_argument(
        "--matches",
        required=True,
        help="マッチングJSONファイルパス",
    )
    parser.add_argument(
        "--images-dir",
        required=True,
        help="画像ディレクトリパス",
    )
    parser.add_argument(
        "--db-url",
        default=None,
        help="データベースURL（オプション）",
    )
    parser.add_argument(
        "--static-dir",
        default="static/images",
        help="静的ファイルディレクトリ（デフォルト: static/images）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際に更新せずにログのみ出力",
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

    # 更新実行
    summary = asyncio.run(update_question_images(
        matches_path=args.matches,
        images_dir=args.images_dir,
        db_url=args.db_url,
        static_dir=args.static_dir,
        dry_run=args.dry_run,
    ))

    print(f"\nSummary:")
    print(f"  Total matches: {summary['total_matches']}")
    print(f"  Images found: {summary['images_found']}")
    print(f"  Images missing: {summary['images_missing']}")
    print(f"  Updated: {summary['updated']}")
    print(f"  Errors: {summary['errors']}")


if __name__ == "__main__":
    main()
