#!/usr/bin/env python3
"""既存問題のフレームワーク一括分類スクリプト

frameworkカラムのみを更新する安全な操作。
問題データ（content, choices, explanation等）は一切変更しない。

Usage:
    python scripts/classify_frameworks.py --dry-run   # プレビュー
    python scripts/classify_frameworks.py              # 実行
"""
import argparse
import asyncio
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.question import Question
from app.services.framework_detector import detect_framework


async def classify_all(dry_run: bool = False) -> None:
    """全問題のframeworkを分類"""
    async with async_session_maker() as db:
        result = await db.execute(select(Question))
        questions = list(result.scalars().all())

        counts = {"pytorch": 0, "tensorflow": 0, "none": 0}
        updated = 0

        for q in questions:
            framework = detect_framework(q.content, q.choices)

            if framework == "pytorch":
                counts["pytorch"] += 1
            elif framework == "tensorflow":
                counts["tensorflow"] += 1
            else:
                counts["none"] += 1

            if not dry_run:
                q.framework = framework
                updated += 1

        if not dry_run:
            await db.commit()

        # サマリー出力
        total = len(questions)
        mode = "[DRY-RUN] " if dry_run else ""
        print(f"\n{mode}フレームワーク分類結果:")
        print(f"  合計: {total}問")
        print(f"  PyTorch: {counts['pytorch']}問")
        print(f"  TensorFlow: {counts['tensorflow']}問")
        print(f"  フレームワーク非依存: {counts['none']}問")
        if not dry_run:
            print(f"\n  {updated}問を更新しました。")
        else:
            print("\n  --dry-runを外して実行すると更新されます。")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="既存問題のフレームワークを一括分類"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際の更新は行わず結果のみ表示",
    )
    args = parser.parse_args()
    asyncio.run(classify_all(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
