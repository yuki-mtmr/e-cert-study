"""問題品質一括修正スクリプト

近似重複削除、文脈欠落修正、テキスト破損修正を実行する。

使用方法:
    python -m scripts.fix_question_quality --dry-run          # プレビューのみ
    python -m scripts.fix_question_quality                    # 実行
    python -m scripts.fix_question_quality --fix-duplicates   # 重複削除のみ
    python -m scripts.fix_question_quality --fix-text         # テキスト破損のみ
    python -m scripts.fix_question_quality --fix-context      # 文脈欠落のみ
"""
import argparse
import logging
import os
import re
import sys
import uuid as uuid_mod
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# テキスト破損の修正パターン: (正規表現, 置換文字列)
# 否定後読み(?<!X)で、既に正しいテキストへの誤マッチを防止
TEXT_FIX_PATTERNS: list[tuple[str, str]] = [
    (r"(?<!完)を了した", "を完了した"),
    (r"(?<!つ)にいて", "について"),
    (r"(?<!そ)れぞれ", "それぞれ"),
]


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def find_near_duplicates(engine: Any) -> list[dict[str, Any]]:
    """LEFT(content, 40)一致グループで近似重複を検出

    各グループからcontentが最長の問題を1つ残し、残りを削除対象とする。

    Returns:
        削除対象のリスト。各要素に group_prefix, keep_id, delete_ids を含む。
    """
    with engine.connect() as conn:
        # 先頭40文字が一致する問題をグループ化
        result = conn.execute(text("""
            SELECT LEFT(content, 40) as prefix,
                   COUNT(*) as cnt,
                   array_agg(id ORDER BY LENGTH(content) DESC) as ids,
                   array_agg(LENGTH(content) ORDER BY LENGTH(content) DESC) as lengths
            FROM questions
            GROUP BY LEFT(content, 40)
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC
        """))
        rows = result.fetchall()

    groups = []
    for row in rows:
        prefix = row[0]
        ids = row[2]
        lengths = row[3]
        # 最長のcontentを持つ問題を残す（ids[0]）
        keep_id = ids[0]
        delete_ids = ids[1:]
        groups.append({
            "group_prefix": prefix[:40],
            "keep_id": str(keep_id),
            "delete_ids": [str(d) for d in delete_ids],
            "keep_length": lengths[0],
        })

    return groups


def delete_duplicates(engine: Any, groups: list[dict[str, Any]], dry_run: bool) -> int:
    """近似重複問題を削除

    Args:
        engine: SQLAlchemyエンジン
        groups: find_near_duplicatesの結果
        dry_run: Trueの場合、削除を実行しない

    Returns:
        削除された問題数
    """
    total_deleted = 0

    for group in groups:
        delete_ids = group["delete_ids"]
        if not delete_ids:
            continue

        logger.info(
            f"グループ: '{group['group_prefix']}...' "
            f"- 残す: {group['keep_id'][:8]} (len={group['keep_length']}), "
            f"削除: {len(delete_ids)}問"
        )

        if dry_run:
            total_deleted += len(delete_ids)
            continue

        with engine.begin() as conn:
            # Python側でUUIDオブジェクトに変換（PostgreSQLの型マッチ）
            uuid_ids = [uuid_mod.UUID(d) for d in delete_ids]
            # 関連データを先に削除（外部キー制約）
            for table in ["mock_exam_answers", "answers", "question_images"]:
                for uid in uuid_ids:
                    conn.execute(
                        text(f"DELETE FROM {table} WHERE question_id = :id"),
                        {"id": uid},
                    )
            for uid in uuid_ids:
                conn.execute(
                    text("DELETE FROM questions WHERE id = :id"),
                    {"id": uid},
                )
            total_deleted += len(delete_ids)

    return total_deleted


def find_context_missing(engine: Any) -> list[dict[str, Any]]:
    """文脈欠落問題を検出

    選択肢に(あ)(い)があるがcontent < 80文字の問題を検出。

    Returns:
        検出された問題のリスト
    """
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, content, choices
            FROM questions
            WHERE LENGTH(content) < 80
            AND (
                choices::text LIKE '%%(あ)%%'
                OR choices::text LIKE '%%(い)%%'
                OR choices::text LIKE '%%(ア)%%'
                OR choices::text LIKE '%%(イ)%%'
            )
        """))
        rows = result.fetchall()

    return [
        {
            "id": str(row[0]),
            "content": row[1],
            "choices": row[2],
        }
        for row in rows
    ]


def find_text_corruption(engine: Any) -> list[dict[str, Any]]:
    """テキスト破損問題を検出

    既知のパターンマッチで破損テキストを検出。

    Returns:
        検出された問題のリスト。各要素に id, content, fixes を含む。
    """
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, content FROM questions"))
        rows = result.fetchall()

    corrupted = []
    for row in rows:
        q_id = str(row[0])
        content = row[1]
        fixes = []

        for pattern, replacement in TEXT_FIX_PATTERNS:
            if re.search(pattern, content):
                fixes.append({
                    "pattern": pattern,
                    "replacement": replacement,
                    "match": re.search(pattern, content).group(),
                })

        if fixes:
            corrupted.append({
                "id": q_id,
                "content_preview": content[:60],
                "fixes": fixes,
            })

    return corrupted


def fix_text_corruption(
    engine: Any, corrupted: list[dict[str, Any]], dry_run: bool,
) -> int:
    """テキスト破損を修正

    Args:
        engine: SQLAlchemyエンジン
        corrupted: find_text_corruptionの結果
        dry_run: Trueの場合、修正を実行しない

    Returns:
        修正された問題数
    """
    fixed_count = 0

    for item in corrupted:
        q_id = item["id"]
        logger.info(
            f"テキスト破損: {item['content_preview']}... "
            f"修正: {[f['pattern'] + ' → ' + f['replacement'] for f in item['fixes']]}"
        )

        if dry_run:
            fixed_count += 1
            continue

        with engine.begin() as conn:
            uid = uuid_mod.UUID(q_id)
            # 現在のcontentを取得
            result = conn.execute(
                text("SELECT content FROM questions WHERE id = :id"),
                {"id": uid},
            )
            row = result.fetchone()
            if not row:
                continue

            content = row[0]
            for fix in item["fixes"]:
                content = re.sub(fix["pattern"], fix["replacement"], content)

            conn.execute(
                text("UPDATE questions SET content = :content WHERE id = :id"),
                {"id": uid, "content": content},
            )
            fixed_count += 1

    return fixed_count


def main() -> None:
    """メイン関数"""
    parser = argparse.ArgumentParser(description="問題品質一括修正")
    parser.add_argument("--dry-run", action="store_true", help="変更をプレビューのみ")
    parser.add_argument("--fix-duplicates", action="store_true", help="近似重複のみ修正")
    parser.add_argument("--fix-text", action="store_true", help="テキスト破損のみ修正")
    parser.add_argument("--fix-context", action="store_true", help="文脈欠落のみ検出")
    args = parser.parse_args()

    # 個別指定がなければ全て実行
    run_all = not (args.fix_duplicates or args.fix_text or args.fix_context)

    db_url = get_db_url()
    if not db_url:
        logger.error("DATABASE_URL が設定されていません")
        sys.exit(1)

    engine = create_engine(db_url)
    mode = "[DRY-RUN]" if args.dry_run else "[実行]"

    # 4a. 近似重複の削除
    if run_all or args.fix_duplicates:
        logger.info(f"\n{'='*60}")
        logger.info(f"{mode} 近似重複チェック")
        logger.info(f"{'='*60}")

        groups = find_near_duplicates(engine)
        total_dupes = sum(len(g["delete_ids"]) for g in groups)
        logger.info(f"検出: {len(groups)}グループ、{total_dupes}問が削除対象")

        if groups:
            deleted = delete_duplicates(engine, groups, args.dry_run)
            logger.info(f"{'削除予定' if args.dry_run else '削除完了'}: {deleted}問")

    # 4b. 文脈欠落の検出
    if run_all or args.fix_context:
        logger.info(f"\n{'='*60}")
        logger.info(f"{mode} 文脈欠落チェック")
        logger.info(f"{'='*60}")

        missing = find_context_missing(engine)
        logger.info(f"検出: {len(missing)}問")
        for item in missing:
            logger.info(
                f"  ID: {item['id'][:8]}... content: '{item['content'][:50]}...'"
            )
        if missing:
            logger.info(
                "文脈欠落問題はClaude CLIで個別修正が必要です。"
                "検出されたIDリストを確認してください。"
            )

    # 4c. テキスト破損の修正
    if run_all or args.fix_text:
        logger.info(f"\n{'='*60}")
        logger.info(f"{mode} テキスト破損チェック")
        logger.info(f"{'='*60}")

        corrupted = find_text_corruption(engine)
        logger.info(f"検出: {len(corrupted)}問")

        if corrupted:
            fixed = fix_text_corruption(engine, corrupted, args.dry_run)
            logger.info(f"{'修正予定' if args.dry_run else '修正完了'}: {fixed}問")

    logger.info(f"\n{'='*60}")
    logger.info("完了")
    logger.info(f"{'='*60}")

    engine.dispose()


if __name__ == "__main__":
    main()
