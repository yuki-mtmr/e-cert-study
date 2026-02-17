"""報告された問題の修正スクリプト

調査結果に基づき、問題データを修正する。
--dry-run でプレビュー必須。mock_exams, mock_exam_answers には一切触れない。

使用方法:
    python -m scripts.fix_reported_questions --dry-run   # プレビュー
    python -m scripts.fix_reported_questions              # 実行
"""
import argparse
import logging
import os
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


def build_remove_images_fix(
    question_id: str, image_ids: list[str],
) -> dict[str, Any] | None:
    """不要画像削除の修正データを生成

    Args:
        question_id: 問題ID
        image_ids: 削除対象の画像IDリスト

    Returns:
        修正データのdict。画像がなければNone。
    """
    if not image_ids:
        return None
    return {
        "question_id": question_id,
        "action": "remove_images",
        "image_ids": image_ids,
    }


def build_fix_choices_fix(
    question_id: str,
    old_choices: list[str],
    new_choices: list[str],
) -> dict[str, Any] | None:
    """選択肢修正の修正データを生成

    Args:
        question_id: 問題ID
        old_choices: 修正前の選択肢
        new_choices: 修正後の選択肢

    Returns:
        修正データのdict。変更がなければNone。
    """
    if old_choices == new_choices:
        return None
    return {
        "question_id": question_id,
        "action": "fix_choices",
        "old_choices": old_choices,
        "new_choices": new_choices,
    }


def build_fix_content_fix(
    question_id: str,
    old_content: str,
    new_content: str,
) -> dict[str, Any] | None:
    """content修正の修正データを生成

    Args:
        question_id: 問題ID
        old_content: 修正前のcontent
        new_content: 修正後のcontent

    Returns:
        修正データのdict。変更がなければNone。
    """
    if old_content == new_content:
        return None
    return {
        "question_id": question_id,
        "action": "fix_content",
        "old_content": old_content,
        "new_content": new_content,
    }


def build_fix_correct_answer_fix(
    question_id: str,
    old_answer: int,
    new_answer: int,
) -> dict[str, Any] | None:
    """correct_answer修正の修正データを生成

    Args:
        question_id: 問題ID
        old_answer: 修正前の正解インデックス
        new_answer: 修正後の正解インデックス

    Returns:
        修正データのdict。変更がなければNone。
    """
    if old_answer == new_answer:
        return None
    return {
        "question_id": question_id,
        "action": "fix_correct_answer",
        "old_answer": old_answer,
        "new_answer": new_answer,
    }


def apply_fix_preview(fix: dict[str, Any]) -> list[str]:
    """修正内容のプレビュー行を生成

    Args:
        fix: 修正データ

    Returns:
        プレビュー出力の行リスト
    """
    lines = [f"  問題ID: {fix['question_id']}"]
    action = fix["action"]
    lines.append(f"  アクション: {action}")

    if action == "remove_images":
        for img_id in fix["image_ids"]:
            lines.append(f"    削除画像: {img_id}")
    elif action == "fix_choices":
        lines.append(f"    変更前: {fix['old_choices']}")
        lines.append(f"    変更後: {fix['new_choices']}")
    elif action == "fix_content":
        lines.append(f"    変更前: {fix['old_content'][:80]}...")
        lines.append(f"    変更後: {fix['new_content'][:80]}...")
    elif action == "fix_correct_answer":
        lines.append(f"    変更前: {fix['old_answer']}")
        lines.append(f"    変更後: {fix['new_answer']}")

    return lines


def execute_fix(engine: Any, fix: dict[str, Any]) -> bool:
    """修正を実行

    Args:
        engine: SQLAlchemyエンジン
        fix: 修正データ

    Returns:
        成功したらTrue
    """
    action = fix["action"]
    q_id = uuid_mod.UUID(fix["question_id"])

    with engine.begin() as conn:
        if action == "remove_images":
            for img_id in fix["image_ids"]:
                uid = uuid_mod.UUID(img_id)
                conn.execute(
                    text("DELETE FROM question_images WHERE id = :id"),
                    {"id": uid},
                )
        elif action == "fix_choices":
            import json
            conn.execute(
                text("UPDATE questions SET choices = :choices WHERE id = :id"),
                {"id": q_id, "choices": json.dumps(fix["new_choices"])},
            )
        elif action == "fix_content":
            conn.execute(
                text("UPDATE questions SET content = :content WHERE id = :id"),
                {"id": q_id, "content": fix["new_content"]},
            )
        elif action == "fix_correct_answer":
            conn.execute(
                text(
                    "UPDATE questions SET correct_answer = :answer WHERE id = :id"
                ),
                {"id": q_id, "answer": fix["new_answer"]},
            )
        else:
            logger.warning(f"不明なアクション: {action}")
            return False

    return True


def get_db_url() -> str:
    """データベースURLを取得"""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    return url.replace("+asyncpg", "")


def collect_fixes(engine: Any) -> list[dict[str, Any]]:
    """調査結果に基づく具体的な修正リストを収集

    2026-02-14調査結果:
    - ゴミ画像削除: question_images からDELETEのみ
    - 重複選択肢修正: questions.choices をUPDATEのみ
    - questionsのDELETEは絶対に行わない
    - mock_exams, mock_exam_answers には一切触れない
    """
    fixes: list[dict[str, Any]] = []

    # === ゴミ画像の削除 ===

    # 2b644fb1 (ユークリッド距離): バス広告画像
    fix = build_remove_images_fix(
        "2b644fb1-736a-4435-a8b2-d611fbafd892",
        ["81f1c103-8fbe-4ec2-9958-d75570b2eab9"],
    )
    if fix:
        fixes.append(fix)

    # 7f18447c (畳み込みカーネル): プレースホルダー画像
    fix = build_remove_images_fix(
        "7f18447c-fbda-4c3f-944f-eae47881758d",
        ["8df845be-59a5-4e58-996e-8604cd8fc1d2"],
    )
    if fix:
        fixes.append(fix)

    # 808d412f (畳み込みカーネル): バス広告 + アート画像2枚
    fix = build_remove_images_fix(
        "808d412f-149f-453e-adee-503ea8e8df0b",
        [
            "31f2d12f-3bca-449a-9606-4c2d8b4cf7dd",
            "506bb267-2116-46ae-ae4d-c10ae780d193",
        ],
    )
    if fix:
        fixes.append(fix)

    # === 重複選択肢の修正 ===

    # 2892e2bf (ユークリッド距離): [0]==[1], [2]==[3]
    # correct_answer=1 → [1]はそのまま維持
    # mock_exam_answers 4件参照あり → correct_answerは変更しない
    # (う)の式を変えて4選択肢をユニークにする
    _collect_euclidean_fix(engine, fixes, "2892e2bf-1384-46e7-8514-0d92184f36dc")

    # 2b644fb1 (ユークリッド距離): 同パターン
    _collect_euclidean_fix(engine, fixes, "2b644fb1-736a-4435-a8b2-d611fbafd892")

    # af99a1b0 (MAE/MSE/RMSE): [0]==[2], [1]==[3]
    # correct_answer=1 → [1]はそのまま維持
    _collect_mae_mse_rmse_fix(engine, fixes, "af99a1b0-ac1d-4c4a-9043-cf8c96117875")

    return fixes


def _collect_euclidean_fix(
    engine: Any, fixes: list[dict[str, Any]], q_id: str,
) -> None:
    """ユークリッド距離問題の重複選択肢を修正

    元の4選択肢は(う)が全て同じLp-norm式。
    [0]と[3]の(う)を別の式に差し替えて4つをユニークにする。
    correct_answer(=1)の選択肢は変更しない。
    """
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT choices FROM questions WHERE id = :id"),
            {"id": q_id},
        )
        row = result.fetchone()

    if not row:
        logger.warning(f"問題が見つかりません: {q_id}")
        return

    old_choices = row[0]
    new_choices = list(old_choices)

    # [0]と[3]の(う)部分を誤った式($\max_i |x_i - y_i|$)に差し替え
    wrong_formula = r"$\max_i |x_i - y_i|$"

    new_choices[0] = _replace_formula_in_choice(old_choices[0], wrong_formula)
    # [1]: 正解（変更なし）
    # [2]: 誤った距離値 + 正しい一般式（変更なし）
    new_choices[3] = _replace_formula_in_choice(old_choices[3], wrong_formula)

    fix = build_fix_choices_fix(q_id, old_choices, new_choices)
    if fix:
        fixes.append(fix)


def _replace_formula_in_choice(choice_text: str, new_formula: str) -> str:
    """選択肢テキストの(う)以降の$...$数式を差し替え"""
    # （う）or (う) の位置を探す
    for marker in ["（う）", "(う)"]:
        pos = choice_text.find(marker)
        if pos >= 0:
            prefix = choice_text[:pos + len(marker)]
            return prefix + new_formula
    return choice_text


def _collect_mae_mse_rmse_fix(
    engine: Any, fixes: list[dict[str, Any]], q_id: str,
) -> None:
    """MAE/MSE/RMSE問題の重複選択肢を修正

    [0]==[2], [1]==[3]
    correct_answer=1 → [1]は変更しない
    [2]: MAE=正, MSE=正, RMSE=MSEと同じ式(sqrt無し) → 誤り
    [3]: MAE=MSE式, MSE=MAE式, RMSE=MSEと同じ式(sqrt無し) → 誤り
    """
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT choices FROM questions WHERE id = :id"),
            {"id": q_id},
        )
        row = result.fetchone()

    if not row:
        logger.warning(f"問題が見つかりません: {q_id}")
        return

    old_choices = row[0]
    new_choices = list(old_choices)

    # [2]: MAE=|y-ŷ|, MSE=(y-ŷ)², RMSE=(1/N)∑(y-ŷ)² (sqrtなし = MSEと同じ)
    new_choices[2] = (
        r"(あ) $\frac{1}{N}\sum_{i=1}^{N}|y_i - \hat{y}_i|$、"
        r"(い) $\frac{1}{N}\sum_{i=1}^{N}(y_i - \hat{y}_i)^2$、"
        r"(う) $\frac{1}{N}\sum_{i=1}^{N}(y_i - \hat{y}_i)^2$"
    )
    # [3]: 全指標が入れ替わり
    new_choices[3] = (
        r"(あ) $\frac{1}{N}\sum_{i=1}^{N}(y_i - \hat{y}_i)^2$、"
        r"(い) $\sqrt{\frac{1}{N}\sum_{i=1}^{N}(y_i - \hat{y}_i)^2}$、"
        r"(う) $\frac{1}{N}\sum_{i=1}^{N}|y_i - \hat{y}_i|$"
    )

    fix = build_fix_choices_fix(q_id, old_choices, new_choices)
    if fix:
        fixes.append(fix)


def main() -> None:
    """メイン関数"""
    parser = argparse.ArgumentParser(description="報告された問題の修正")
    parser.add_argument("--dry-run", action="store_true", help="変更をプレビューのみ")
    args = parser.parse_args()

    db_url = get_db_url()
    if not db_url:
        logger.error("DATABASE_URL が設定されていません")
        sys.exit(1)

    engine = create_engine(db_url)
    mode = "[DRY-RUN]" if args.dry_run else "[実行]"

    logger.info(f"\n{'='*60}")
    logger.info(f"{mode} 報告問題の修正")
    logger.info(f"{'='*60}")

    fixes = collect_fixes(engine)

    if not fixes:
        logger.info("修正対象がありません")
    else:
        logger.info(f"修正対象: {len(fixes)}件")
        for fix in fixes:
            lines = apply_fix_preview(fix)
            for line in lines:
                logger.info(line)

            if not args.dry_run:
                success = execute_fix(engine, fix)
                if success:
                    logger.info("  → 修正完了")
                else:
                    logger.error("  → 修正失敗")

    engine.dispose()

    logger.info(f"\n{'='*60}")
    logger.info("完了")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
