"""重複QuestionImageレコードの検出・削除スクリプト

Usage:
    # Dry run（削除せずに検出のみ）
    python -m scripts.fix_duplicate_images --dry-run

    # 実行（重複を削除）
    python -m scripts.fix_duplicate_images
"""
import argparse
import logging
import uuid
from collections import defaultdict
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class ImageRecord(Protocol):
    """QuestionImageレコードのプロトコル"""
    id: uuid.UUID
    question_id: uuid.UUID
    file_path: str


def find_duplicates(records: list[Any]) -> list[Any]:
    """重複レコードを検出する

    同一(question_id, file_path)のペアが複数ある場合、
    最初のレコードを残し、残りを削除対象として返す。

    Args:
        records: QuestionImageレコードのリスト

    Returns:
        削除対象のレコードリスト
    """
    groups: dict[tuple[uuid.UUID, str], list[Any]] = defaultdict(list)
    for record in records:
        key = (record.question_id, record.file_path)
        groups[key].append(record)

    duplicates: list[Any] = []
    for key, group in groups.items():
        if len(group) > 1:
            # 最初のレコードを残し、残りを削除対象に
            duplicates.extend(group[1:])

    return duplicates


def deduplicate_records(
    records: list[Any],
    dry_run: bool = True,
) -> list[uuid.UUID]:
    """重複レコードを除去して削除対象IDを返す

    Args:
        records: QuestionImageレコードのリスト
        dry_run: Trueの場合は検出のみで削除しない

    Returns:
        削除対象のレコードIDリスト
    """
    duplicates = find_duplicates(records)
    ids_to_delete = [r.id for r in duplicates]

    if dry_run:
        logger.info(f"[DRY RUN] {len(ids_to_delete)} duplicate records found")
        for dup in duplicates:
            logger.info(
                f"  Would delete: id={dup.id}, "
                f"question_id={dup.question_id}, "
                f"file_path={dup.file_path}"
            )
    else:
        logger.info(f"Deleting {len(ids_to_delete)} duplicate records")

    return ids_to_delete


async def run_fix(dry_run: bool = True) -> dict[str, int]:
    """DB上の重複QuestionImageレコードを修正する

    Args:
        dry_run: Trueの場合は検出のみで削除しない

    Returns:
        処理結果の統計
    """
    from sqlalchemy import select, delete

    from app.core.database import async_session_maker
    from app.models.question_image import QuestionImage

    async with async_session_maker() as db:
        result = await db.execute(select(QuestionImage))
        all_records = list(result.scalars().all())

        logger.info(f"Total QuestionImage records: {len(all_records)}")

        ids_to_delete = deduplicate_records(all_records, dry_run=dry_run)

        if not dry_run and ids_to_delete:
            await db.execute(
                delete(QuestionImage).where(QuestionImage.id.in_(ids_to_delete))
            )
            await db.commit()
            logger.info(f"Deleted {len(ids_to_delete)} duplicate records")

        return {
            "total_records": len(all_records),
            "duplicates_found": len(ids_to_delete),
            "deleted": 0 if dry_run else len(ids_to_delete),
        }


def main() -> None:
    """メインエントリーポイント"""
    parser = argparse.ArgumentParser(
        description="重複QuestionImageレコードの検出・削除"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="削除せずに検出のみ行う",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    import asyncio
    stats = asyncio.run(run_fix(dry_run=args.dry_run))

    print(f"\n結果:")
    print(f"  総レコード数: {stats['total_records']}")
    print(f"  重複検出数: {stats['duplicates_found']}")
    print(f"  削除数: {stats['deleted']}")


if __name__ == "__main__":
    main()
