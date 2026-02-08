#!/usr/bin/env python3
"""既存answersテーブルから復習アイテムを生成する移行スクリプト

各ユーザー×問題の回答履歴を分析し、review_itemsテーブルにデータを移行する。
- 不正解が1回でもある問題 → review_item作成
- 最終不正解以降の連続正解数をcorrect_countに設定
- 連続正解が10回以上 → mastered

Usage:
    python scripts/migrate_review_items.py --dry-run   # プレビュー
    python scripts/migrate_review_items.py              # 実行
"""
import argparse
import asyncio
import sys
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.answer import Answer
from app.models.review_item import ReviewItem
from app.services.review_service import MASTERY_THRESHOLD


async def migrate(dry_run: bool = False) -> None:
    """answersテーブルからreview_itemsを生成"""
    async with async_session_maker() as db:
        # 全回答を時系列順に取得
        result = await db.execute(
            select(Answer).order_by(Answer.answered_at.asc())
        )
        answers = list(result.scalars().all())

        print(f"回答レコード数: {len(answers)}")

        # ユーザー×問題ごとに回答履歴をグループ化
        history: dict[tuple[str, str], list[Answer]] = defaultdict(list)
        for answer in answers:
            key = (answer.user_id, str(answer.question_id))
            history[key].append(answer)

        print(f"ユーザー×問題の組み合わせ数: {len(history)}")

        created = 0
        mastered = 0
        skipped = 0

        for (user_id, question_id_str), user_answers in history.items():
            question_id = uuid.UUID(question_id_str)

            # 不正解が1回もなければスキップ
            has_incorrect = any(not a.is_correct for a in user_answers)
            if not has_incorrect:
                skipped += 1
                continue

            # 最初の不正解日時
            first_wrong = next(
                a.answered_at for a in user_answers if not a.is_correct
            )

            # 最終不正解以降の連続正解数を計算
            correct_count = 0
            last_answered = user_answers[-1].answered_at
            for a in reversed(user_answers):
                if a.is_correct:
                    correct_count += 1
                else:
                    break

            # mastered判定
            status = "mastered" if correct_count >= MASTERY_THRESHOLD else "active"
            mastered_at = last_answered if status == "mastered" else None

            if dry_run:
                status_label = f"[{status}]"
                print(
                    f"  {status_label:10s} user={user_id[:20]}... "
                    f"q={question_id_str[:8]}... "
                    f"correct_count={correct_count}"
                )
            else:
                # 既存チェック
                existing_result = await db.execute(
                    select(ReviewItem).where(
                        ReviewItem.question_id == question_id,
                        ReviewItem.user_id == user_id,
                    )
                )
                if existing_result.scalar_one_or_none():
                    skipped += 1
                    continue

                item = ReviewItem(
                    id=uuid.uuid4(),
                    question_id=question_id,
                    user_id=user_id,
                    correct_count=correct_count,
                    status=status,
                    first_wrong_at=first_wrong,
                    last_answered_at=last_answered,
                    mastered_at=mastered_at,
                )
                db.add(item)

            created += 1
            if status == "mastered":
                mastered += 1

        if not dry_run:
            await db.commit()

        print(f"\n--- 結果 ---")
        print(f"作成: {created} (うちmastered: {mastered})")
        print(f"スキップ（不正解なし or 既存）: {skipped}")
        if dry_run:
            print("(dry-runモード: データベースは変更されていません)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="既存answersからreview_itemsを生成"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="プレビューのみ（DB変更なし）",
    )
    args = parser.parse_args()

    asyncio.run(migrate(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
