"""報告された問題の調査スクリプト

5つのキーワードでDBを検索し、問題データ + 紐付き画像を出力する。
ピュア診断関数はDB不要でテスト可能。

使用方法:
    python -m scripts.investigate_reported_questions
"""
import argparse
import logging
import os
import re
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

# 調査対象キーワード
REPORTED_KEYWORDS = [
    "ユークリッド距離",
    "マクロ平均とマイクロ平均",
    "MAE、MSE、RMSE",
    "畳み込み演算カーネル",
    "アンカーフリー",
]

# 画像参照を示すキーワード
IMAGE_REFERENCE_KEYWORDS = ["図", "画像", "グラフ", "表", "チャート", "ダイアグラム"]


def diagnose_duplicate_choices(choices: list[str]) -> list[dict[str, Any]]:
    """重複する選択肢を検出する

    Args:
        choices: 選択肢のリスト

    Returns:
        重複情報のリスト。各要素は value と indices を持つ。
    """
    seen: dict[str, list[int]] = {}
    for i, choice in enumerate(choices):
        seen.setdefault(choice, []).append(i)

    return [
        {"value": value, "indices": indices}
        for value, indices in seen.items()
        if len(indices) > 1
    ]


def diagnose_missing_context(
    content: str, choices: list[str],
) -> dict[str, Any] | None:
    """選択肢に(あ)(い)等のマーカーがあるがcontentにない問題を検出

    Args:
        content: 問題文
        choices: 選択肢のリスト

    Returns:
        問題がある場合は情報を含むdict、なければNone
    """
    markers = ["(あ)", "(い)", "(う)", "(え)", "(ア)", "(イ)", "(ウ)", "(エ)"]
    choices_text = " ".join(choices)

    # 選択肢にマーカーがあるか確認
    found_in_choices = [m for m in markers if m in choices_text]
    if not found_in_choices:
        return None

    # contentにマーカーがあるか確認
    missing = [m for m in found_in_choices if m not in content]
    if not missing:
        return None

    return {
        "missing_markers": missing,
        "found_in_choices": found_in_choices,
    }


def diagnose_unnecessary_images(
    content: str, images: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """画像参照なしだが画像が紐付いている問題を検出

    Args:
        content: 問題文
        images: 紐付き画像のリスト（file_path, alt_text を持つ）

    Returns:
        不要と判定された画像のリスト
    """
    if not images:
        return []

    # markdownの画像参照があるか
    has_md_image = bool(re.search(r"!\[.*?\]\(.*?\)", content))

    # 画像参照キーワードがあるか
    has_keyword = any(kw in content for kw in IMAGE_REFERENCE_KEYWORDS)

    if has_md_image or has_keyword:
        return []

    return [{"file_path": img["file_path"], "alt_text": img.get("alt_text")} for img in images]


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def investigate(engine: Any) -> None:
    """キーワードでDB検索し、診断結果を出力"""
    for keyword in REPORTED_KEYWORDS:
        logger.info(f"\n{'='*60}")
        logger.info(f"キーワード: {keyword}")
        logger.info(f"{'='*60}")

        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT q.id, q.content, q.choices, q.correct_answer, q.explanation
                    FROM questions q
                    WHERE q.content LIKE :kw
                    ORDER BY q.id
                """),
                {"kw": f"%{keyword}%"},
            )
            questions = result.fetchall()

        if not questions:
            logger.info("  → 問題が見つかりません")
            continue

        for q in questions:
            q_id, content, choices, correct_answer, explanation = q
            logger.info(f"\n  ID: {q_id}")
            logger.info(f"  content: {content[:100]}...")
            logger.info(f"  choices: {choices}")
            logger.info(f"  correct_answer: {correct_answer}")

            # 画像を取得
            with engine.connect() as conn:
                img_result = conn.execute(
                    text("""
                        SELECT file_path, alt_text, position
                        FROM question_images
                        WHERE question_id = :qid
                        ORDER BY position
                    """),
                    {"qid": q_id},
                )
                images = [
                    {"file_path": r[0], "alt_text": r[1], "position": r[2]}
                    for r in img_result.fetchall()
                ]

            if images:
                logger.info(f"  images: {images}")
            else:
                logger.info("  images: なし")

            # 診断実行
            dupes = diagnose_duplicate_choices(choices)
            if dupes:
                logger.info(f"  [!] 重複選択肢: {dupes}")

            missing = diagnose_missing_context(content, choices)
            if missing:
                logger.info(f"  [!] 文脈欠落: {missing}")

            unnecessary = diagnose_unnecessary_images(content, images)
            if unnecessary:
                logger.info(f"  [!] 不要画像: {unnecessary}")


def main() -> None:
    """メイン関数"""
    parser = argparse.ArgumentParser(description="報告された問題の調査")
    parser.parse_args()

    db_url = get_db_url()
    if not db_url:
        logger.error("DATABASE_URL が設定されていません")
        sys.exit(1)

    engine = create_engine(db_url)
    investigate(engine)
    engine.dispose()

    logger.info(f"\n{'='*60}")
    logger.info("調査完了")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
