"""画像表示問題の修正スクリプト

PDFから画像を再抽出し、Supabase Storageにアップロードして
DBのfile_pathを更新する

使用方法:
    python -m scripts.fix_question_images --pdf-path /path/to/pdf
    python -m scripts.fix_question_images --pdf-path /path/to/pdf --dry-run
"""
import argparse
import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from supabase import create_client

from app.services.mineru_extractor import MinerUExtractor

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    # asyncpgをpsycopg2に変換（同期実行用）
    return url.replace("+asyncpg", "")


def get_supabase_client():
    """Supabaseクライアントを取得"""
    load_dotenv()
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

    return create_client(url, key)


async def get_question_images_from_db() -> list[dict]:
    """DBから画像付き問題を取得

    Returns:
        画像レコードのリスト。各レコードには以下のフィールドが含まれる:
        - id: 画像ID
        - question_id: 問題ID
        - file_path: 現在のファイルパス
        - alt_text: 代替テキスト
        - position: 位置
        - question_content: 問題文
    """
    url = get_db_url()
    if not url:
        logger.error("DATABASE_URL not found")
        return []

    engine = create_engine(url)

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                qi.id,
                qi.question_id,
                qi.file_path,
                qi.alt_text,
                qi.position,
                q.content as question_content
            FROM question_images qi
            JOIN questions q ON q.id = qi.question_id
            ORDER BY q.id, qi.position
        """))

        images = []
        for row in result:
            images.append({
                "id": row[0],
                "question_id": row[1],
                "file_path": row[2],
                "alt_text": row[3],
                "position": row[4],
                "question_content": row[5],
            })

        return images


async def extract_images_from_pdf(pdf_path: Path) -> list[dict]:
    """PDFから画像を抽出

    Args:
        pdf_path: PDFファイルのパス

    Returns:
        抽出された画像のリスト。各画像には以下のフィールドが含まれる:
        - data: 画像バイナリデータ
        - page_number: ページ番号
        - position: ページ内での位置
        - filename: ファイル名
    """
    if not pdf_path.exists():
        logger.error(f"PDF file not found: {pdf_path}")
        return []

    try:
        pdf_data = pdf_path.read_bytes()
        extractor = MinerUExtractor()
        result = await extractor.extract(pdf_data, fallback_on_error=True)

        images = []
        for img in result.images:
            images.append({
                "data": img.data,
                "page_number": img.page_number,
                "position": img.position,
                "filename": img.filename,
            })

        logger.info(f"Extracted {len(images)} images from PDF")
        return images

    except Exception as e:
        logger.error(f"Failed to extract images from PDF: {e}")
        return []


async def upload_image_to_supabase(
    image_data: bytes,
    question_id: uuid.UUID,
    position: int,
    bucket_name: str = "question-images",
) -> str:
    """画像をSupabase Storageにアップロード

    Args:
        image_data: 画像バイナリデータ
        question_id: 問題ID
        position: 位置
        bucket_name: バケット名

    Returns:
        公開URL

    Raises:
        ValueError: 空のデータが渡された場合
    """
    if not image_data:
        raise ValueError("Empty image data provided")

    client = get_supabase_client()

    # 画像フォーマットを検出
    img_format = "png"
    content_type = "image/png"

    if image_data[:2] == b'\xff\xd8':
        img_format = "jpeg"
        content_type = "image/jpeg"
    elif image_data[:8] == b'\x89PNG\r\n\x1a\n':
        img_format = "png"
        content_type = "image/png"

    # ファイル名生成
    image_id = uuid.uuid4()
    filename = f"{question_id}/{position:03d}_{image_id}.{img_format}"

    try:
        storage = client.storage.from_(bucket_name)
        storage.upload(
            path=filename,
            file=image_data,
            file_options={"content-type": content_type}
        )

        public_url = storage.get_public_url(filename)
        logger.info(f"Uploaded image to Supabase: {filename}")

        return public_url

    except Exception as e:
        logger.error(f"Failed to upload image to Supabase: {e}")
        raise


async def update_image_path_in_db(
    image_id: uuid.UUID,
    new_path: str,
) -> bool:
    """DBの画像パスを更新

    Args:
        image_id: 画像ID
        new_path: 新しいパス（URL）

    Returns:
        成功したらTrue
    """
    url = get_db_url()
    if not url:
        logger.error("DATABASE_URL not found")
        return False

    engine = create_engine(url)

    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE question_images
                    SET file_path = :new_path
                    WHERE id = :image_id
                """),
                {"new_path": new_path, "image_id": image_id},
            )
            conn.commit()

        logger.info(f"Updated image path for {image_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to update image path: {e}")
        return False


def match_image_to_question(
    db_images: list[dict],
    extracted_images: list[dict],
) -> list[dict]:
    """抽出した画像とDB上の画像をマッチング

    現状はページ番号と位置でマッチングを試みる。
    より高度なマッチングが必要な場合は画像の類似度などを使う。

    Args:
        db_images: DBの画像レコード
        extracted_images: PDFから抽出した画像

    Returns:
        マッチング結果のリスト
    """
    # シンプルな位置ベースのマッチング
    # 実際にはもっと高度なマッチングが必要になる可能性がある
    matches = []

    for i, db_img in enumerate(db_images):
        if i < len(extracted_images):
            matches.append({
                "db_image": db_img,
                "extracted_image": extracted_images[i],
            })

    return matches


async def fix_question_images(
    pdf_path: Path,
    dry_run: bool = False,
) -> dict:
    """画像表示問題を修正するメイン関数

    Args:
        pdf_path: PDFファイルのパス
        dry_run: Trueの場合、実際の更新は行わない

    Returns:
        処理結果の辞書
    """
    logger.info(f"Starting fix_question_images (dry_run={dry_run})")

    # 1. DBから画像付き問題を取得
    logger.info("Step 1: Getting question images from DB...")
    db_images = await get_question_images_from_db()
    logger.info(f"Found {len(db_images)} images in DB")

    if not db_images:
        return {
            "success": False,
            "error": "No images found in database",
            "images_processed": 0,
        }

    # 2. PDFから画像を抽出
    logger.info("Step 2: Extracting images from PDF...")
    extracted_images = await extract_images_from_pdf(pdf_path)
    logger.info(f"Extracted {len(extracted_images)} images from PDF")

    if not extracted_images:
        return {
            "success": False,
            "error": "Failed to extract images from PDF",
            "images_processed": 0,
        }

    # 3. 画像をマッチング
    logger.info("Step 3: Matching images...")
    matches = match_image_to_question(db_images, extracted_images)
    logger.info(f"Matched {len(matches)} images")

    # 4. Supabaseにアップロードしてパスを更新
    logger.info("Step 4: Uploading to Supabase and updating DB...")
    processed = 0
    errors = []

    for match in matches:
        db_img = match["db_image"]
        ext_img = match["extracted_image"]

        try:
            if dry_run:
                logger.info(f"[DRY RUN] Would upload image for question {db_img['question_id']}")
                processed += 1
            else:
                # Supabaseにアップロード
                url = await upload_image_to_supabase(
                    image_data=ext_img["data"],
                    question_id=db_img["question_id"],
                    position=db_img["position"],
                )

                # DBを更新
                success = await update_image_path_in_db(
                    image_id=db_img["id"],
                    new_path=url,
                )

                if success:
                    processed += 1
                else:
                    errors.append(f"Failed to update DB for image {db_img['id']}")

        except Exception as e:
            errors.append(f"Error processing image {db_img['id']}: {e}")
            logger.error(f"Error processing image {db_img['id']}: {e}")

    result = {
        "success": len(errors) == 0,
        "images_processed": processed,
        "total_db_images": len(db_images),
        "total_extracted_images": len(extracted_images),
        "matches": len(matches),
        "errors": errors,
        "dry_run": dry_run,
    }

    logger.info(f"Completed: {result}")
    return result


async def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="Fix question images by re-extracting from PDF and uploading to Supabase"
    )
    parser.add_argument(
        "--pdf-path",
        type=str,
        required=True,
        help="Path to the PDF file",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without making actual changes",
    )

    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        logger.error(f"PDF file not found: {pdf_path}")
        sys.exit(1)

    result = await fix_question_images(
        pdf_path=pdf_path,
        dry_run=args.dry_run,
    )

    if result["success"]:
        logger.info("Fix completed successfully!")
        sys.exit(0)
    else:
        logger.error(f"Fix failed: {result.get('errors', [])}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
