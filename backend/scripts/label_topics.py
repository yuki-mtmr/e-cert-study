#!/usr/bin/env python3
"""既存問題のトピック一括ラベリングスクリプト

Anthropic APIで問題文+カテゴリ名からトピックを推定し、
Question.topicカラムを更新する。

Usage:
    python scripts/label_topics.py --dry-run --limit 5   # プレビュー
    python scripts/label_topics.py --limit 50             # 50問を処理
    python scripts/label_topics.py --batch-size 10        # バッチサイズ指定
"""
import argparse
import asyncio
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Optional

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import async_session_maker
from app.models.category import Category
from app.models.question import Question

logger = logging.getLogger(__name__)

client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def call_anthropic_api(prompt: str) -> str:
    """Anthropic APIを呼び出してレスポンスを取得"""
    response = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


async def estimate_topic(content: str, category_name: str) -> str:
    """単一問題のトピックを推定

    Args:
        content: 問題文
        category_name: カテゴリ名

    Returns:
        推定されたトピック名
    """
    prompt = f"""以下のE資格問題のトピック名を1つ、簡潔に答えてください。
カテゴリ: {category_name}
問題文: {content[:500]}

トピック名のみを出力してください（例: ベイズ則, バッチ正規化, Adam, LSTM等）。"""

    result = await call_anthropic_api(prompt)
    return result.strip()


def build_batch_prompt(questions: list[dict[str, str]]) -> str:
    """バッチ処理用のプロンプトを構築

    Args:
        questions: 問題リスト（各要素にid, content, category_nameを含む）

    Returns:
        バッチプロンプト文字列
    """
    lines = ["以下の各E資格問題について、具体的なトピック名を推定してください。",
             "結果はJSON形式で出力してください: {\"問題ID\": \"トピック名\", ...}",
             "トピック名は簡潔に（例: ベイズ則, バッチ正規化, Adam, LSTM, Attention等）。",
             ""]

    for q in questions:
        content_preview = q["content"][:200]
        lines.append(f"ID: {q['id']}")
        lines.append(f"カテゴリ: {q['category_name']}")
        lines.append(f"問題文: {content_preview}")
        lines.append("")

    return "\n".join(lines)


def parse_batch_response(response: str) -> dict[str, str]:
    """バッチレスポンスをパースしてID→トピック名の辞書を返す

    Args:
        response: APIレスポンステキスト

    Returns:
        問題ID→トピック名の辞書
    """
    text = response.strip()

    # コードブロック内のJSONを抽出
    json_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if json_match:
        text = json_match.group(1)
    else:
        # 直接のJSONオブジェクトを探す
        obj_match = re.search(r"(\{[\s\S]*\})", text)
        if obj_match:
            text = obj_match.group(1)

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return {k: str(v).strip() for k, v in data.items()}
    except (json.JSONDecodeError, ValueError):
        logger.warning(f"Failed to parse batch response: {text[:200]}")

    return {}


async def label_all(
    dry_run: bool = False,
    limit: int = 100,
    batch_size: int = 10,
) -> None:
    """topic未設定の問題にトピックをラベリング

    Args:
        dry_run: Trueの場合、DBを更新しない
        limit: 処理する最大問題数
        batch_size: 1回のAPI呼び出しで処理する問題数
    """
    async with async_session_maker() as db:
        # topic未設定の問題を取得
        result = await db.execute(
            select(Question)
            .options(selectinload(Question.category))
            .where(Question.topic.is_(None))
            .limit(limit)
        )
        questions = list(result.scalars().all())

        total = len(questions)
        if total == 0:
            print("トピック未設定の問題はありません。")
            return

        print(f"トピック未設定の問題: {total}問")
        mode = "[DRY-RUN] " if dry_run else ""

        labeled = 0
        failed = 0

        # バッチ処理
        for i in range(0, total, batch_size):
            batch = questions[i:i + batch_size]
            batch_data = []
            for q in batch:
                cat_name = q.category.name if q.category else "不明"
                batch_data.append({
                    "id": str(q.id),
                    "content": q.content,
                    "category_name": cat_name,
                })

            try:
                prompt = build_batch_prompt(batch_data)
                response = await call_anthropic_api(prompt)
                topics = parse_batch_response(response)

                for q in batch:
                    q_id = str(q.id)
                    if q_id in topics and topics[q_id]:
                        topic = topics[q_id]
                        print(f"  {mode}{q.content[:50]}... -> {topic}")
                        if not dry_run:
                            q.topic = topic
                        labeled += 1
                    else:
                        print(f"  [SKIP] {q.content[:50]}...")
                        failed += 1

            except Exception as e:
                logger.error(f"Batch {i // batch_size + 1} failed: {e}")
                failed += len(batch)
                continue

        if not dry_run:
            await db.commit()

        print(f"\n{mode}トピックラベリング結果:")
        print(f"  合計: {total}問")
        print(f"  ラベル付与: {labeled}問")
        print(f"  失敗/スキップ: {failed}問")


def main() -> None:
    parser = argparse.ArgumentParser(description="既存問題にトピックラベルを付与")
    parser.add_argument("--dry-run", action="store_true", help="プレビューのみ（DB更新なし）")
    parser.add_argument("--limit", type=int, default=100, help="処理する最大問題数")
    parser.add_argument("--batch-size", type=int, default=10, help="バッチサイズ")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    asyncio.run(label_all(dry_run=args.dry_run, limit=args.limit, batch_size=args.batch_size))


if __name__ == "__main__":
    main()
