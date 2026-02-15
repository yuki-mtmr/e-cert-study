"""LIME問題の文脈欠落修正スクリプト

LIME（局所的な解釈可能なモデル非依存の説明）の問題で、
問題文に(ア)(イ)を含む数式部分が欠落しているケースを修正する。

PDF抽出時に数式 g(z) = φ₀ + Σφᵢzᵢ の一部が失われたと推定。
Claude CLIで問題文を再生成し、(ア)(イ)の穴埋め付き数式を復元する。

制約:
  - mock_exams, mock_exam_answers には一切触れない
  - questions の DELETE は絶対に行わない
  - correct_answer は変更しない
  - 変更するのは questions.content と content_hash のみ

使用方法:
    python -m scripts.fix_lime_question --dry-run   # プレビュー
    python -m scripts.fix_lime_question              # 実行
"""
import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text

from scripts.fix_context_missing import (
    call_claude_cli,
    _compute_content_hash,
)

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# LIME問題で使われるカタカナマーカー
LIME_MARKER_CHARS = ["ア", "イ"]


def find_lime_questions(rows: list[tuple]) -> list[dict[str, Any]]:
    """DBの行データからLIME + (ア)(イ)マーカー付き問題を特定

    contentにLIMEが含まれ、選択肢に(ア)(イ)マーカーがあり、
    contentにはマーカーが欠落している問題を返す。

    Args:
        rows: (id, content, choices, correct_answer, explanation) のタプルリスト

    Returns:
        対象問題の辞書リスト
    """
    results = []

    for row in rows:
        q_id, content, choices, correct_answer, explanation = row

        # contentにLIMEが含まれるか
        if "LIME" not in content:
            continue

        # 選択肢に(ア)(イ)マーカーがあるか
        choices_text = " ".join(choices)
        has_markers = all(
            f"({c})" in choices_text or f"（{c}）" in choices_text
            for c in LIME_MARKER_CHARS
        )
        if not has_markers:
            continue

        # contentに既にマーカーが含まれているか
        content_has_all = all(
            f"({c})" in content or f"（{c}）" in content
            for c in LIME_MARKER_CHARS
        )
        if content_has_all:
            continue

        results.append({
            "id": str(q_id),
            "content": content,
            "choices": choices,
            "correct_answer": correct_answer,
            "explanation": explanation,
        })

    return results


def build_lime_prompt(
    content: str,
    choices: list[str],
    correct_answer: int,
    explanation: str,
) -> str:
    """LIME問題用のClaude CLIプロンプトを生成

    Args:
        content: 現在の問題文
        choices: 選択肢リスト
        correct_answer: 正解インデックス (0-based)
        explanation: 解説テキスト

    Returns:
        プロンプト文字列
    """
    choices_text = "\n".join(
        f"{chr(65 + i)}. {choice}" for i, choice in enumerate(choices)
    )
    correct_label = chr(65 + correct_answer)

    return f"""以下のE資格LIME問題は、PDF抽出時に数式部分が欠落し、(ア)(イ)の穴埋め箇所が問題文にない。
LIMEの説明モデル g(z) = φ₀ + Σφᵢzᵢ の数式を含む穴埋め問題文を再生成せよ。

【現在の問題文】
{content}

【選択肢】
{choices_text}

【正解】{correct_label}

【解説】
{explanation}

【指示】
- 問題文のみを出力せよ（選択肢・解説は不要）
- LIMEの説明モデル g(z) の数式を含め、(ア)(イ)が穴埋め箇所として自然に登場する形にせよ
- 正解が変わらないようにせよ
- E資格レベルの専門性を維持せよ
- LIMEという単語を問題文に含めよ
- マーカーの括弧は半角 (ア)(イ) を使用せよ"""


def validate_lime_content(new_content: str, choices: list[str]) -> bool:
    """生成されたLIME問題文が要件を満たすか検証

    Args:
        new_content: 生成された問題文
        choices: 選択肢リスト

    Returns:
        (ア)(イ)両方含み、LIMEも含まれていればTrue
    """
    if not new_content:
        return False

    # LIMEという単語が含まれていること
    if "LIME" not in new_content:
        return False

    # (ア)(イ)マーカーが含まれていること（半角/全角両方許容）
    for char in LIME_MARKER_CHARS:
        half = f"({char})"
        full = f"（{char}）"
        if half not in new_content and full not in new_content:
            return False

    return True


async def regenerate_lime_content(
    question: dict[str, Any],
    max_retries: int = 1,
) -> str | None:
    """Claude CLIでLIME問題のcontentを再生成

    Args:
        question: 問題データ
        max_retries: リトライ回数

    Returns:
        生成されたcontent。失敗時はNone。
    """
    prompt = build_lime_prompt(
        content=question["content"],
        choices=question["choices"],
        correct_answer=question["correct_answer"],
        explanation=question["explanation"],
    )

    for attempt in range(1 + max_retries):
        try:
            new_content = await call_claude_cli(prompt)
            if validate_lime_content(new_content, question["choices"]):
                return new_content
            logger.warning(
                f"  バリデーション失敗 (試行{attempt + 1}): "
                f"(ア)(イ)またはLIMEが不足しています"
            )
        except RuntimeError as e:
            logger.error(f"  Claude CLI エラー (試行{attempt + 1}): {e}")

    return None


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def main() -> None:
    """メイン関数"""
    parser = argparse.ArgumentParser(description="LIME問題の文脈欠落修正")
    parser.add_argument(
        "--dry-run", action="store_true", help="変更をプレビューのみ",
    )
    args = parser.parse_args()

    db_url = get_db_url()
    if not db_url:
        logger.error("DATABASE_URL が設定されていません")
        sys.exit(1)

    engine = create_engine(db_url)
    mode = "[DRY-RUN]" if args.dry_run else "[実行]"

    logger.info(f"\n{'='*60}")
    logger.info(f"{mode} LIME問題の文脈欠落修正")
    logger.info(f"{'='*60}")

    # LIME問題を検索
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT id, content, choices, correct_answer, explanation "
                "FROM questions "
                "WHERE content LIKE '%LIME%' "
                "ORDER BY id"
            )
        )
        rows = result.fetchall()

    lime_questions = find_lime_questions(rows)
    logger.info(f"対象LIME問題: {len(lime_questions)}件")

    if not lime_questions:
        logger.info("修正対象のLIME問題はありません")
        engine.dispose()
        return

    # 各問題を表示/修正
    fixed = 0
    skipped = 0

    for q in lime_questions:
        logger.info(f"\n  問題ID: {q['id']}")
        logger.info(f"    現在のcontent: {q['content'][:100]}...")
        logger.info(f"    選択肢: {q['choices']}")

        if args.dry_run:
            fixed += 1
            continue

        new_content = asyncio.run(regenerate_lime_content(q))
        if new_content is None:
            logger.error("    → スキップ（生成失敗）")
            skipped += 1
            continue

        logger.info(f"    生成content: {new_content[:100]}...")

        new_hash = _compute_content_hash(new_content)
        with engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE questions "
                    "SET content = :content, content_hash = :hash "
                    "WHERE id = :id"
                ),
                {"id": q["id"], "content": new_content, "hash": new_hash},
            )
        logger.info("    → 修正完了")
        fixed += 1

    label = "処理予定" if args.dry_run else "処理完了"
    logger.info(f"\n{label}: {fixed}件")
    if skipped:
        logger.info(f"スキップ: {skipped}件")

    engine.dispose()

    logger.info(f"\n{'='*60}")
    logger.info("完了")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
