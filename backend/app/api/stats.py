"""統計APIエンドポイント"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.answer import Answer
from app.models.question import Question
from app.models.category import Category

router = APIRouter(prefix="/api/stats", tags=["stats"])


class OverviewStats(BaseModel):
    """学習概要統計"""
    totalAnswered: int
    correctCount: int
    incorrectCount: int
    accuracy: float


class CategoryStats(BaseModel):
    """カテゴリ別統計"""
    categoryId: str
    categoryName: str
    totalAnswered: int
    correctCount: int
    accuracy: float


class DailyProgress(BaseModel):
    """日別進捗"""
    date: str
    answered: int
    correct: int


class CategoryCoverage(BaseModel):
    """カテゴリ別網羅率"""
    categoryId: str
    categoryName: str
    totalQuestions: int
    answeredCount: int
    correctCount: int
    coverageRate: float
    accuracy: float


@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> OverviewStats:
    """学習概要統計を取得"""
    # 総回答数
    total_result = await db.execute(
        select(func.count(Answer.id)).where(Answer.user_id == user_id)
    )
    total_answered = total_result.scalar() or 0

    # 正解数
    correct_result = await db.execute(
        select(func.count(Answer.id)).where(
            Answer.user_id == user_id,
            Answer.is_correct == True,  # noqa: E712
        )
    )
    correct_count = correct_result.scalar() or 0

    incorrect_count = total_answered - correct_count
    accuracy = (correct_count / total_answered * 100) if total_answered > 0 else 0.0

    return OverviewStats(
        totalAnswered=total_answered,
        correctCount=correct_count,
        incorrectCount=incorrect_count,
        accuracy=round(accuracy, 1),
    )


@router.get("/weak-areas", response_model=list[CategoryStats])
async def get_weak_areas(
    user_id: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
) -> list[CategoryStats]:
    """苦手分野（正解率が低いカテゴリ）を取得"""
    # カテゴリ別の正解率を計算
    result = await db.execute(
        select(
            Category.id,
            Category.name,
            func.count(Answer.id).label("total"),
            func.sum(func.cast(Answer.is_correct, Integer)).label("correct"),
            (func.sum(func.cast(Answer.is_correct, Integer)) * 100.0 / func.count(Answer.id)).label("accuracy"),
        )
        .join(Question, Question.category_id == Category.id)
        .join(Answer, Answer.question_id == Question.id)
        .where(Answer.user_id == user_id)
        .group_by(Category.id, Category.name)
        .having(func.count(Answer.id) >= 5)  # 最低5問以上回答したカテゴリのみ
        .order_by("accuracy")
        .limit(limit)
    )

    rows = result.all()
    return [
        CategoryStats(
            categoryId=str(row[0]),
            categoryName=row[1],
            totalAnswered=row[2],
            correctCount=row[3] or 0,
            accuracy=round(row[4] or 0, 1),
        )
        for row in rows
    ]


@router.get("/progress", response_model=list[DailyProgress])
async def get_progress(
    user_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
) -> list[DailyProgress]:
    """日別進捗を取得"""
    result = await db.execute(
        select(
            cast(Answer.answered_at, Date).label("date"),
            func.count(Answer.id).label("answered"),
            func.sum(func.cast(Answer.is_correct, Integer)).label("correct"),
        )
        .where(Answer.user_id == user_id)
        .group_by(cast(Answer.answered_at, Date))
        .order_by("date")
        .limit(days)
    )

    rows = result.all()
    return [
        DailyProgress(
            date=str(row[0]),
            answered=row[1],
            correct=row[2] or 0,
        )
        for row in rows
    ]


# Integer型のインポートを追加
from sqlalchemy import Integer
from sqlalchemy.sql import expression


@router.get("/category-coverage", response_model=list[CategoryCoverage])
async def get_category_coverage(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[CategoryCoverage]:
    """カテゴリ別網羅率を取得

    各カテゴリの総問題数、回答済み問題数、正解数、網羅率、正答率を返す
    """
    # サブクエリ: ユーザーの回答済み問題と正解数をカウント
    user_answers = (
        select(
            Question.category_id,
            func.count(Answer.id.distinct()).label("answered_count"),
            func.sum(func.cast(Answer.is_correct, Integer)).label("correct_count"),
        )
        .join(Answer, Answer.question_id == Question.id)
        .where(Answer.user_id == user_id)
        .group_by(Question.category_id)
        .subquery()
    )

    # メインクエリ: カテゴリ別の問題数と回答状況を結合
    result = await db.execute(
        select(
            Category.id,
            Category.name,
            func.count(Question.id).label("total_questions"),
            func.coalesce(user_answers.c.answered_count, 0).label("answered_count"),
            func.coalesce(user_answers.c.correct_count, 0).label("correct_count"),
        )
        .outerjoin(Question, Question.category_id == Category.id)
        .outerjoin(user_answers, user_answers.c.category_id == Category.id)
        .group_by(
            Category.id,
            Category.name,
            user_answers.c.answered_count,
            user_answers.c.correct_count,
        )
        .order_by(Category.name)
    )

    rows = result.all()
    return [
        CategoryCoverage(
            categoryId=str(row[0]),
            categoryName=row[1],
            totalQuestions=row[2],
            answeredCount=row[3],
            correctCount=row[4],
            coverageRate=round((row[3] / row[2] * 100) if row[2] > 0 else 0.0, 1),
            accuracy=round((row[4] / row[3] * 100) if row[3] > 0 else 0.0, 1),
        )
        for row in rows
    ]
