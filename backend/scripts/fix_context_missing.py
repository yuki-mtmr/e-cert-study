"""文脈欠落問題の一括修正スクリプト

選択肢に(あ)(い)等のマーカーがあるのにcontent（問題文）にそのマーカーの文脈がない
問題を検出し、Claude CLIでcontentを再生成する。
括弧スタイル不一致（全角/半角）も統一する。

制約:
  - mock_exams, mock_exam_answers には一切触れない
  - questions の DELETE は絶対に行わない
  - correct_answer は変更しない
  - 変更するのは questions.content のみ（+ 括弧不一致は questions.choices の括弧統一）

使用方法:
    python -m scripts.fix_context_missing --dry-run   # プレビュー
    python -m scripts.fix_context_missing              # 実行
"""
import argparse
import asyncio
import hashlib
import json
import logging
import os
import sys
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

# 半角/全角マーカーのペア
MARKER_CHARS = ["あ", "い", "う", "え", "ア", "イ", "ウ", "エ"]
HALF_MARKERS = [f"({c})" for c in MARKER_CHARS]
FULL_MARKERS = [f"（{c}）" for c in MARKER_CHARS]


def build_content_prompt(
    content: str,
    choices: list[str],
    correct_answer: int,
    explanation: str,
) -> str:
    """Claude CLIに送るプロンプト文字列を生成

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

    return f"""以下のE資格問題は、選択肢に(あ)(い)等のマーカーがあるが問題文にそのマーカーの文脈がない。
問題文を書き直して、(あ)(い)等が自然に登場する穴埋め形式にせよ。

【現在の問題文】
{content}

【選択肢】
{choices_text}

【正解】{correct_label}

【解説】
{explanation}

【指示】
- 問題文のみを出力せよ（選択肢・解説は不要）
- 選択肢に含まれるマーカー（(あ)(い)等）が問題文中に自然に登場する穴埋め形式にせよ
- 正解が変わらないようにせよ
- E資格レベルの専門性を維持せよ
- マーカーの括弧は全角（あ）（い）を使用せよ"""


def _extract_markers_from_choices(choices: list[str]) -> list[str]:
    """選択肢からユニークなマーカー文字を抽出

    Returns:
        マーカー文字のリスト（例: ["あ", "い", "う"]）
    """
    choices_text = " ".join(choices)
    found = []
    for char in MARKER_CHARS:
        half = f"({char})"
        full = f"（{char}）"
        if half in choices_text or full in choices_text:
            if char not in found:
                found.append(char)
    return found


def validate_generated_content(new_content: str, choices: list[str]) -> bool:
    """生成されたcontentが選択肢のマーカーを全て含むか検証

    半角(あ) ↔ 全角（あ）の揺れを許容する。

    Args:
        new_content: 生成された問題文
        choices: 選択肢リスト

    Returns:
        全マーカーが含まれていればTrue
    """
    if not new_content:
        return False

    marker_chars = _extract_markers_from_choices(choices)
    if not marker_chars:
        return True

    for char in marker_chars:
        half = f"({char})"
        full = f"（{char}）"
        if half not in new_content and full not in new_content:
            return False

    return True


def normalize_choice_parens(
    choices: list[str], target_style: str = "full",
) -> list[str]:
    """選択肢の括弧スタイルを統一

    Args:
        choices: 選択肢リスト
        target_style: "full"（全角）or "half"（半角）

    Returns:
        括弧が統一された選択肢リスト
    """
    result = []
    for choice in choices:
        new_choice = choice
        for char in MARKER_CHARS:
            if target_style == "full":
                new_choice = new_choice.replace(f"({char})", f"（{char}）")
            else:
                new_choice = new_choice.replace(f"（{char}）", f"({char})")
        result.append(new_choice)
    return result


def find_context_missing_questions(engine: Any) -> dict[str, list[dict]]:
    """文脈欠落問題をDBから検索し、括弧不一致 vs 本当の文脈欠落を分類

    Args:
        engine: SQLAlchemyエンジン

    Returns:
        {"truly_missing": [...], "paren_mismatch": [...]}
    """
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT id, content, choices, correct_answer, explanation "
                "FROM questions ORDER BY created_at"
            )
        )
        rows = result.fetchall()

    truly_missing = []
    paren_mismatch = []

    for row in rows:
        q_id, content, choices, correct_answer, explanation = row

        # 選択肢からマーカー文字を抽出
        marker_chars = _extract_markers_from_choices(choices)
        if not marker_chars:
            continue

        # contentにマーカーがあるか確認（半角・全角両方チェック）
        content_has_all = True
        content_has_any_variant = False
        for char in marker_chars:
            half = f"({char})"
            full = f"（{char}）"
            if half in content or full in content:
                content_has_any_variant = True
            else:
                content_has_all = False

        if content_has_all:
            # contentに全マーカーあり → 括弧スタイルの不一致チェック
            # 選択肢が半角でcontentが全角（or逆）ならparen_mismatch
            choices_text = " ".join(choices)
            choices_has_half = any(f"({c})" in choices_text for c in marker_chars)
            choices_has_full = any(f"（{c}）" in choices_text for c in marker_chars)
            content_has_half = any(f"({c})" in content for c in marker_chars)
            content_has_full = any(f"（{c}）" in content for c in marker_chars)

            # スタイル不一致: 片方だけ半角、もう片方だけ全角
            if (choices_has_half and not choices_has_full and
                    content_has_full and not content_has_half):
                paren_mismatch.append({
                    "id": str(q_id),
                    "content": content,
                    "choices": choices,
                    "correct_answer": correct_answer,
                    "explanation": explanation,
                    "marker_chars": marker_chars,
                })
            elif (choices_has_full and not choices_has_half and
                    content_has_half and not content_has_full):
                paren_mismatch.append({
                    "id": str(q_id),
                    "content": content,
                    "choices": choices,
                    "correct_answer": correct_answer,
                    "explanation": explanation,
                    "marker_chars": marker_chars,
                })
        elif not content_has_any_variant:
            # contentにマーカーが一切ない → 本当の文脈欠落
            truly_missing.append({
                "id": str(q_id),
                "content": content,
                "choices": choices,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "marker_chars": marker_chars,
            })
        else:
            # 一部のマーカーだけcontentにある → 本当の文脈欠落扱い
            truly_missing.append({
                "id": str(q_id),
                "content": content,
                "choices": choices,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "marker_chars": marker_chars,
            })

    return {"truly_missing": truly_missing, "paren_mismatch": paren_mismatch}


async def call_claude_cli(prompt: str) -> str:
    """Claude Code CLIをsubprocessで呼び出してレスポンスを取得"""
    process = await asyncio.create_subprocess_exec(
        "claude", "-p", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    stdout_text = stdout.decode()
    stderr_text = stderr.decode()

    if process.returncode != 0:
        raise RuntimeError(f"Claude CLI failed: {stderr_text}")

    return stdout_text.strip()


async def regenerate_content(
    question: dict[str, Any],
    max_retries: int = 1,
) -> str | None:
    """Claude CLIでcontentを再生成

    Args:
        question: 問題データ
        max_retries: リトライ回数

    Returns:
        生成されたcontent。失敗時はNone。
    """
    prompt = build_content_prompt(
        content=question["content"],
        choices=question["choices"],
        correct_answer=question["correct_answer"],
        explanation=question["explanation"],
    )

    for attempt in range(1 + max_retries):
        try:
            new_content = await call_claude_cli(prompt)
            if validate_generated_content(new_content, question["choices"]):
                return new_content
            logger.warning(
                f"  バリデーション失敗 (試行{attempt + 1}): "
                f"マーカーが不足しています"
            )
        except RuntimeError as e:
            logger.error(f"  Claude CLI エラー (試行{attempt + 1}): {e}")

    return None


def _compute_content_hash(content: str) -> str:
    """問題文のハッシュを計算（32文字）"""
    return hashlib.sha256(content.encode()).hexdigest()[:32]


async def _process_truly_missing(
    engine: Any, truly_missing: list[dict],
) -> tuple[int, int]:
    """文脈欠落問題をClaude CLIで一括再生成

    Args:
        engine: SQLAlchemyエンジン
        truly_missing: 文脈欠落問題リスト

    Returns:
        (修正件数, スキップ件数)
    """
    content_fixed = 0
    content_skipped = 0

    for q in truly_missing:
        logger.info(f"  問題ID: {q['id']}")
        logger.info(f"    現在のcontent: {q['content'][:80]}...")
        logger.info(f"    マーカー: {q['marker_chars']}")

        new_content = await regenerate_content(q)
        if new_content is None:
            logger.error("    → スキップ（生成失敗）")
            content_skipped += 1
            continue

        logger.info(f"    生成content: {new_content[:80]}...")

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
        content_fixed += 1

    return content_fixed, content_skipped


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def main() -> None:
    """メイン関数"""
    parser = argparse.ArgumentParser(description="文脈欠落問題の一括修正")
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
    logger.info(f"{mode} 文脈欠落問題の一括修正")
    logger.info(f"{'='*60}")

    # 問題を分類
    classified = find_context_missing_questions(engine)
    truly_missing = classified["truly_missing"]
    paren_mismatch = classified["paren_mismatch"]

    logger.info(f"文脈欠落: {len(truly_missing)}件")
    logger.info(f"括弧不一致: {len(paren_mismatch)}件")

    # === 括弧不一致の修正（機械的） ===
    logger.info(f"\n{'='*60}")
    logger.info(f"{mode} 括弧スタイル統一（choices の半角→全角）")
    logger.info(f"{'='*60}")

    paren_fixed = 0
    for q in paren_mismatch:
        new_choices = normalize_choice_parens(q["choices"], target_style="full")
        logger.info(f"  問題ID: {q['id']}")
        logger.info(f"    変更前: {q['choices'][:2]}...")
        logger.info(f"    変更後: {new_choices[:2]}...")

        if not args.dry_run:
            with engine.begin() as conn:
                conn.execute(
                    text("UPDATE questions SET choices = :choices WHERE id = :id"),
                    {"id": q["id"], "choices": json.dumps(new_choices)},
                )
            logger.info("    → 修正完了")
        paren_fixed += 1

    label = "処理予定" if args.dry_run else "処理完了"
    logger.info(f"括弧統一 {label}: {paren_fixed}件")

    # === 文脈欠落の修正（Claude CLI） ===
    logger.info(f"\n{'='*60}")
    logger.info(f"{mode} content再生成（Claude CLI）")
    logger.info(f"{'='*60}")

    if truly_missing and not args.dry_run:
        content_fixed, content_skipped = asyncio.run(
            _process_truly_missing(engine, truly_missing)
        )
    else:
        # dry-run: プレビューのみ
        for q in truly_missing:
            logger.info(f"  問題ID: {q['id']}")
            logger.info(f"    現在のcontent: {q['content'][:80]}...")
            logger.info(f"    マーカー: {q['marker_chars']}")
        content_fixed = len(truly_missing)
        content_skipped = 0

    logger.info(f"content再生成 {label}: {content_fixed}件")
    if content_skipped:
        logger.info(f"スキップ: {content_skipped}件")

    engine.dispose()

    logger.info(f"\n{'='*60}")
    logger.info("完了")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
