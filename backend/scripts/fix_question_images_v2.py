"""画像表示問題の修正スクリプト v2

PDFのページ全体をレンダリングして画像として使用する版
問題文でPDFを検索し、該当ページをレンダリングしてSupabaseにアップロード
"""
import argparse
import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path

import pymupdf
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from supabase import create_client

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def get_supabase_client():
    """Supabaseクライアントを取得"""
    load_dotenv()
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(url, key)


def get_question_images_from_db() -> list[dict]:
    """DBから画像付き問題を取得"""
    url = get_db_url()
    engine = create_engine(url)

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT
                qi.id,
                qi.question_id,
                qi.file_path,
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
                "position": row[3],
                "question_content": row[4],
            })
        return images


def find_page_for_question(doc: pymupdf.Document, question_content: str) -> int | None:
    """問題文からPDFのページを検索

    Args:
        doc: PyMuPDFドキュメント
        question_content: 問題文

    Returns:
        ページ番号（見つからない場合はNone）
    """
    import re

    # 問題文から検索キーワードを抽出
    # 特殊文字を正規化
    normalized = question_content.replace("（", "(").replace("）", ")").replace("　", " ")

    # 意味のあるキーワードを抽出（日本語、英語、記号を含む）
    # 専門用語や固有名詞を優先
    keywords = []

    # 技術用語パターン
    tech_patterns = [
        r'[A-Za-z]+[0-9]*',  # 英語の単語（Attention, ReLU, CNN等）
        r'[ァ-ヴー]+',  # カタカナ語
    ]

    for pattern in tech_patterns:
        matches = re.findall(pattern, normalized)
        for m in matches:
            if len(m) >= 3 and m not in keywords:
                keywords.append(m)

    # 問題文の特徴的な部分（最初の数文字）
    first_line = normalized.split("\n")[0][:40]
    if first_line:
        keywords.append(first_line)

    # ページスコアを計算
    page_scores = {}
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text = page.get_text()
        score = 0

        for kw in keywords:
            if kw in text:
                score += len(kw)  # 長いキーワードほど高スコア

        if score > 0:
            page_scores[page_num] = score

    # 最高スコアのページを返す
    if page_scores:
        best_page = max(page_scores, key=page_scores.get)
        if page_scores[best_page] >= 5:  # 最低スコア閾値
            return best_page

    return None


def render_page_to_image(doc: pymupdf.Document, page_num: int, scale: float = 2.0) -> bytes:
    """PDFページをPNG画像にレンダリング

    Args:
        doc: PyMuPDFドキュメント
        page_num: ページ番号
        scale: スケール（デフォルト2.0で高解像度）

    Returns:
        PNG画像のバイナリデータ
    """
    page = doc[page_num]
    mat = pymupdf.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png")


def upload_image_to_supabase(
    image_data: bytes,
    question_id: uuid.UUID,
    position: int,
    bucket_name: str = "question-images",
) -> str:
    """画像をSupabase Storageにアップロード"""
    if not image_data:
        raise ValueError("Empty image data")

    client = get_supabase_client()

    image_id = uuid.uuid4()
    filename = f"{question_id}/{position:03d}_{image_id}.png"

    storage = client.storage.from_(bucket_name)

    # 既存のファイルを削除（上書き用）
    try:
        storage.remove([filename])
    except Exception:
        pass  # ファイルが存在しない場合は無視

    storage.upload(
        path=filename,
        file=image_data,
        file_options={"content-type": "image/png"}
    )

    return storage.get_public_url(filename)


def update_image_path_in_db(image_id: uuid.UUID, new_path: str) -> bool:
    """DBの画像パスを更新"""
    url = get_db_url()
    engine = create_engine(url)

    try:
        with engine.connect() as conn:
            conn.execute(
                text("UPDATE question_images SET file_path = :new_path WHERE id = :image_id"),
                {"new_path": new_path, "image_id": image_id},
            )
            conn.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to update DB: {e}")
        return False


def fix_question_images(pdf_path: Path, dry_run: bool = False) -> dict:
    """画像を修正するメイン関数"""
    logger.info(f"Starting fix (dry_run={dry_run})")

    # 手動ページマッピング（検索で見つからなかった問題用）
    MANUAL_PAGE_MAPPING = {
        "2767bfee": 257,  # データ拡張
        "4806714f": 113,  # tanh関数（解説ページ）
        "790c9de3": 126,  # 計算グラフ 全結合層
        "cd22f7f8": 177,  # 特徴マップ
    }

    # 1. DBから画像付き問題を取得
    db_images = get_question_images_from_db()
    logger.info(f"Found {len(db_images)} images in DB")

    if not db_images:
        return {"success": False, "error": "No images found", "processed": 0}

    # 2. PDFを開く
    doc = pymupdf.open(pdf_path)
    logger.info(f"PDF has {doc.page_count} pages")

    # 3. 各問題のページを特定してレンダリング
    processed = 0
    errors = []

    # 同じ問題IDの画像をグループ化（同じページを複数回レンダリングしないため）
    question_pages = {}  # question_id -> page_num

    for img in db_images:
        question_id = str(img["question_id"])

        if question_id not in question_pages:
            # 手動マッピングを優先
            manual_match = None
            for prefix, page in MANUAL_PAGE_MAPPING.items():
                if question_id.startswith(prefix):
                    manual_match = page
                    break

            if manual_match is not None:
                page_num = manual_match
                logger.info(f"Question {question_id[:8]}... manually mapped to page {page_num}")
            else:
                page_num = find_page_for_question(doc, img["question_content"])

            question_pages[question_id] = page_num
            if page_num is not None and manual_match is None:
                logger.info(f"Question {question_id[:8]}... found on page {page_num}")
            elif page_num is None:
                logger.warning(f"Question {question_id[:8]}... not found in PDF")

    # 4. ページをレンダリングしてアップロード
    rendered_cache = {}  # page_num -> image_data

    for img in db_images:
        question_id = str(img["question_id"])
        page_num = question_pages.get(question_id)

        if page_num is None:
            errors.append(f"Page not found for question {question_id[:8]}")
            continue

        try:
            # ページをレンダリング（キャッシュを使用）
            if page_num not in rendered_cache:
                rendered_cache[page_num] = render_page_to_image(doc, page_num)
                logger.info(f"Rendered page {page_num} ({len(rendered_cache[page_num]):,} bytes)")

            image_data = rendered_cache[page_num]

            if dry_run:
                logger.info(f"[DRY RUN] Would upload page {page_num} for question {question_id[:8]}...")
                processed += 1
            else:
                # Supabaseにアップロード
                url = upload_image_to_supabase(
                    image_data=image_data,
                    question_id=img["question_id"],
                    position=img["position"],
                )
                logger.info(f"Uploaded: {url}")

                # DBを更新
                if update_image_path_in_db(img["id"], url):
                    processed += 1
                else:
                    errors.append(f"Failed to update DB for {img['id']}")

        except Exception as e:
            errors.append(f"Error processing {question_id[:8]}: {e}")
            logger.error(f"Error: {e}")

    doc.close()

    result = {
        "success": len(errors) == 0,
        "processed": processed,
        "total": len(db_images),
        "errors": errors,
        "dry_run": dry_run,
    }
    logger.info(f"Completed: {result}")
    return result


def main():
    parser = argparse.ArgumentParser(description="Fix question images using PDF page rendering")
    parser.add_argument("--pdf-path", type=str, required=True, help="Path to PDF file")
    parser.add_argument("--dry-run", action="store_true", help="Run without making changes")
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        logger.error(f"PDF not found: {pdf_path}")
        sys.exit(1)

    result = fix_question_images(pdf_path, dry_run=args.dry_run)

    if result["success"]:
        logger.info("Fix completed successfully!")
        sys.exit(0)
    else:
        logger.error(f"Fix failed: {result.get('errors', [])}")
        sys.exit(1)


if __name__ == "__main__":
    main()
