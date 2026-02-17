"""模試サービス

問題選択・スコア計算・ルールベース分析
"""
import logging
import math
import uuid
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.question import Question
from app.services.mock_exam_config import (
    EXAM_AREAS,
    PASSING_THRESHOLD,
    get_grade,
)

logger = logging.getLogger(__name__)


async def select_questions_for_exam(
    db: AsyncSession,
) -> list[dict[str, Any]]:
    """模試用の100問をカテゴリ配分に従い選択

    Args:
        db: データベースセッション

    Returns:
        選択された問題リスト（各要素にquestion, exam_area, category_nameを含む）
    """
    selected: list[dict[str, Any]] = []
    selected_ids: set[uuid.UUID] = set()

    for area_name, area_config in EXAM_AREAS.items():
        db_category_name = area_config["db_category"]
        target_count = area_config["question_count"]

        # 親カテゴリを取得
        parent_result = await db.execute(
            select(Category).where(
                Category.name == db_category_name,
                Category.parent_id.is_(None),
            )
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            logger.warning(f"親カテゴリ '{db_category_name}' が見つかりません")
            continue

        # 親カテゴリ + 子カテゴリのIDを取得
        children_result = await db.execute(
            select(Category.id).where(Category.parent_id == parent.id)
        )
        child_ids = [row[0] for row in children_result.all()]
        category_ids = [parent.id] + child_ids

        # ランダムに問題を選択（TensorFlow専用問題を除外、既出問題を除外）
        query = (
            select(Question)
            .options(selectinload(Question.images))
            .where(Question.category_id.in_(category_ids))
            .where(
                (Question.framework.is_(None))
                | (Question.framework != "tensorflow")
            )
            .order_by(func.random())
            .limit(target_count)
        )
        if selected_ids:
            query = query.where(~Question.id.in_(selected_ids))

        questions_result = await db.execute(query)
        questions = list(questions_result.scalars().all())

        if len(questions) < target_count:
            logger.warning(
                f"エリア '{area_name}': {target_count}問中 {len(questions)}問のみ利用可能"
            )

        for q in questions:
            selected_ids.add(q.id)
            selected.append({
                "question": q,
                "exam_area": area_name,
                "category_name": db_category_name,
            })

    return selected


def calculate_scores(answers: list[dict[str, Any]]) -> dict[str, Any]:
    """回答リストからスコアを計算

    Args:
        answers: 回答リスト（各要素に is_correct, exam_area を含む）

    Returns:
        correct_count, score, passed, category_scores を含む辞書
    """
    if not answers:
        return {
            "correct_count": 0,
            "score": 0.0,
            "passed": False,
            "category_scores": {},
            "topic_scores": {},
        }

    total = len(answers)
    correct_count = sum(1 for a in answers if a.get("is_correct") is True)
    score = (correct_count / total) * 100.0 if total > 0 else 0.0
    passed = score >= PASSING_THRESHOLD

    # カテゴリ別スコア集計
    area_stats: dict[str, dict[str, int]] = {}
    for a in answers:
        area = a.get("exam_area", "不明")
        if area not in area_stats:
            area_stats[area] = {"total": 0, "correct": 0}
        area_stats[area]["total"] += 1
        if a.get("is_correct") is True:
            area_stats[area]["correct"] += 1

    category_scores: dict[str, dict[str, Any]] = {}
    for area, stats in area_stats.items():
        accuracy = (stats["correct"] / stats["total"]) * 100.0 if stats["total"] > 0 else 0.0
        category_scores[area] = {
            "total": stats["total"],
            "correct": stats["correct"],
            "accuracy": round(accuracy, 1),
            "grade": get_grade(accuracy),
        }

    # トピック別スコア集計
    topic_stats: dict[str, dict[str, int]] = {}
    for a in answers:
        topic = a.get("topic")
        if not topic:
            continue
        if topic not in topic_stats:
            topic_stats[topic] = {"total": 0, "correct": 0}
        topic_stats[topic]["total"] += 1
        if a.get("is_correct") is True:
            topic_stats[topic]["correct"] += 1

    topic_scores: dict[str, dict[str, Any]] = {}
    for topic, stats in topic_stats.items():
        accuracy = (stats["correct"] / stats["total"]) * 100.0 if stats["total"] > 0 else 0.0
        topic_scores[topic] = {
            "total": stats["total"],
            "correct": stats["correct"],
            "accuracy": round(accuracy, 1),
        }

    return {
        "correct_count": correct_count,
        "score": round(score, 1),
        "passed": passed,
        "category_scores": category_scores,
        "topic_scores": topic_scores,
    }


def generate_rule_based_analysis(
    score: float,
    correct_count: int,
    total: int,
    passed: bool,
    category_scores: dict[str, dict[str, Any]],
) -> str:
    """ルールベースの辛口分析を生成

    Args:
        score: 正答率
        correct_count: 正答数
        total: 総問題数
        passed: 合否
        category_scores: カテゴリ別スコア

    Returns:
        Markdown形式の分析テキスト
    """
    lines: list[str] = []

    # 合否判定コメント
    if passed:
        if score >= 90:
            lines.append("## 合格 - 余裕あり")
            lines.append(f"スコア **{score}%** ({correct_count}/{total})。実力は本物です。")
        elif score >= 75:
            lines.append("## 合格 - 安全圏")
            lines.append(f"スコア **{score}%** ({correct_count}/{total})。合格圏内ですが、油断は禁物。")
        else:
            lines.append("## 合格 - ギリギリ")
            lines.append(
                f"スコア **{score}%** ({correct_count}/{total})。"
                "本番では落ちる可能性大。更なる対策が必要です。"
            )
    else:
        required = math.ceil((PASSING_THRESHOLD / 100.0) * total)
        remaining = required - correct_count
        lines.append("## 不合格")
        lines.append(
            f"スコア **{score}%** ({correct_count}/{total})。"
            f"合格まであと **{remaining}問** 正解が必要です。"
        )
        if score < 40:
            lines.append("勉強量が圧倒的に足りていません。基礎からやり直してください。")

    lines.append("")

    # カテゴリ別分析
    if category_scores:
        lines.append("## カテゴリ別分析")
        lines.append("")

        # グレード順に並べ替え（悪い順）
        grade_order = {"F": 0, "D": 1, "C": 2, "B": 3, "A": 4, "S": 5}
        sorted_areas = sorted(
            category_scores.items(),
            key=lambda x: grade_order.get(x[1].get("grade", "F"), 0),
        )

        grade_comments = {
            "S": "完璧。この調子を維持してください。",
            "A": "良好。ケアレスミスに注意。",
            "B": "合格水準だが改善の余地あり。",
            "C": "不安定。重点的に復習が必要。",
            "D": "基礎から学び直す必要があります。",
            "F": "壊滅的。最優先で対策してください。",
        }

        for area_name, detail in sorted_areas:
            grade = detail.get("grade", "F")
            accuracy = detail.get("accuracy", 0.0)
            correct = detail.get("correct", 0)
            area_total = detail.get("total", 0)
            comment = grade_comments.get(grade, "")
            lines.append(
                f"- **{area_name}** [{grade}] {accuracy}% ({correct}/{area_total}) - {comment}"
            )

        lines.append("")

        # 最優先対策分野
        weakest = sorted_areas[0] if sorted_areas else None
        if weakest:
            lines.append("## 最優先対策分野")
            lines.append(
                f"**{weakest[0]}** (グレード: {weakest[1].get('grade', 'F')}) を "
                "最優先で強化してください。"
            )

    return "\n".join(lines)
