#!/usr/bin/env python3
"""E資格カテゴリをシードするスクリプト

既存のカテゴリがあっても、E資格カテゴリを追加する。
"""
import asyncio
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.category import Category
import uuid


# E資格カテゴリ構成
E_CERT_CATEGORIES: dict[str, list[str]] = {
    "応用数学": ["線形代数", "確率・統計", "情報理論"],
    "機械学習": ["教師あり学習", "教師なし学習", "評価指標"],
    "深層学習": [
        "順伝播型ニューラルネットワーク",
        "CNN",
        "RNN",
        "Transformer",
        "生成モデル",
        "強化学習",
    ],
}


async def seed_categories() -> None:
    """E資格カテゴリをシード"""
    async with async_session_maker() as db:
        # 既存カテゴリ名を取得
        result = await db.execute(select(Category.name))
        existing_names = set(result.scalars().all())

        created_count = 0

        for parent_name, children_names in E_CERT_CATEGORIES.items():
            # 親カテゴリ
            if parent_name not in existing_names:
                parent = Category(
                    id=uuid.uuid4(),
                    name=parent_name,
                    parent_id=None,
                )
                db.add(parent)
                await db.flush()
                created_count += 1
                print(f"作成: {parent_name}")
            else:
                # 既存の親カテゴリを取得
                parent_result = await db.execute(
                    select(Category).where(Category.name == parent_name)
                )
                parent = parent_result.scalar_one()
                print(f"既存: {parent_name}")

            # 子カテゴリ
            for child_name in children_names:
                if child_name not in existing_names:
                    child = Category(
                        id=uuid.uuid4(),
                        name=child_name,
                        parent_id=parent.id,
                    )
                    db.add(child)
                    created_count += 1
                    print(f"  作成: {child_name}")
                else:
                    print(f"  既存: {child_name}")

        await db.commit()
        print(f"\n合計 {created_count} 個のカテゴリを作成しました")


if __name__ == "__main__":
    asyncio.run(seed_categories())
