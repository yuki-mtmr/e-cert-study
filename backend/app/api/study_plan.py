"""学習プランAPIエンドポイント"""
from datetime import date, datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.study_plan import StudyPlan, DailyGoal

router = APIRouter(prefix="/api/study-plan", tags=["study-plan"])


class StudyPlanCreate(BaseModel):
    """学習プラン作成リクエスト"""
    user_id: str
    exam_date: date
    target_questions_per_day: int = 20


class StudyPlanUpdate(BaseModel):
    """学習プラン更新リクエスト"""
    exam_date: Optional[date] = None
    target_questions_per_day: Optional[int] = None


class StudyPlanResponse(BaseModel):
    """学習プランレスポンス"""
    id: str
    userId: str
    examDate: date
    targetQuestionsPerDay: int
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}


class DailyProgressResponse(BaseModel):
    """日別進捗レスポンス"""
    date: date
    targetCount: int
    actualCount: int
    correctCount: int


class StudyPlanSummaryResponse(BaseModel):
    """学習プランサマリーレスポンス"""
    daysRemaining: int
    totalAnswered: int
    totalCorrect: int
    accuracy: float
    streak: int
    dailyProgress: List[DailyProgressResponse]


class DeleteResponse(BaseModel):
    """削除レスポンス"""
    message: str


@router.post("", response_model=StudyPlanResponse)
async def create_study_plan(
    data: StudyPlanCreate,
    db: AsyncSession = Depends(get_db),
) -> StudyPlanResponse:
    """学習プランを作成"""
    now = datetime.now()
    study_plan = StudyPlan(
        user_id=data.user_id,
        exam_date=data.exam_date,
        target_questions_per_day=data.target_questions_per_day,
        created_at=now,
        updated_at=now,
    )
    db.add(study_plan)
    await db.commit()
    await db.refresh(study_plan)

    return StudyPlanResponse(
        id=str(study_plan.id),
        userId=study_plan.user_id,
        examDate=study_plan.exam_date,
        targetQuestionsPerDay=study_plan.target_questions_per_day,
        createdAt=study_plan.created_at,
        updatedAt=study_plan.updated_at,
    )


@router.get("", response_model=StudyPlanResponse)
async def get_study_plan(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> StudyPlanResponse:
    """学習プランを取得"""
    result = await db.execute(
        select(StudyPlan).where(StudyPlan.user_id == user_id)
    )
    study_plan = result.scalars().first()

    if not study_plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    return StudyPlanResponse(
        id=str(study_plan.id),
        userId=study_plan.user_id,
        examDate=study_plan.exam_date,
        targetQuestionsPerDay=study_plan.target_questions_per_day,
        createdAt=study_plan.created_at,
        updatedAt=study_plan.updated_at,
    )


@router.put("", response_model=StudyPlanResponse)
async def update_study_plan(
    user_id: str,
    data: StudyPlanUpdate,
    db: AsyncSession = Depends(get_db),
) -> StudyPlanResponse:
    """学習プランを更新"""
    result = await db.execute(
        select(StudyPlan).where(StudyPlan.user_id == user_id)
    )
    study_plan = result.scalars().first()

    if not study_plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    if data.exam_date is not None:
        study_plan.exam_date = data.exam_date
    if data.target_questions_per_day is not None:
        study_plan.target_questions_per_day = data.target_questions_per_day

    study_plan.updated_at = datetime.now()
    await db.commit()
    await db.refresh(study_plan)

    return StudyPlanResponse(
        id=str(study_plan.id),
        userId=study_plan.user_id,
        examDate=study_plan.exam_date,
        targetQuestionsPerDay=study_plan.target_questions_per_day,
        createdAt=study_plan.created_at,
        updatedAt=study_plan.updated_at,
    )


@router.delete("", response_model=DeleteResponse)
async def delete_study_plan(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> DeleteResponse:
    """学習プランを削除"""
    result = await db.execute(
        select(StudyPlan).where(StudyPlan.user_id == user_id)
    )
    study_plan = result.scalars().first()

    if not study_plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    await db.delete(study_plan)
    await db.commit()

    return DeleteResponse(message="Study plan deleted successfully")


@router.get("/summary", response_model=StudyPlanSummaryResponse)
async def get_study_plan_summary(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> StudyPlanSummaryResponse:
    """学習プランサマリーを取得"""
    # 学習プラン取得
    result = await db.execute(
        select(StudyPlan).where(StudyPlan.user_id == user_id)
    )
    study_plan = result.scalars().first()

    if not study_plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    # 残り日数計算
    today = date.today()
    days_remaining = (study_plan.exam_date - today).days

    # 日別進捗取得
    daily_result = await db.execute(
        select(DailyGoal)
        .where(DailyGoal.study_plan_id == study_plan.id)
        .order_by(DailyGoal.date.desc())
    )
    daily_goals = daily_result.scalars().all()

    # 合計計算
    total_answered = sum(dg.actual_count for dg in daily_goals)
    total_correct = sum(dg.correct_count for dg in daily_goals)
    accuracy = (total_correct / total_answered * 100) if total_answered > 0 else 0.0

    # 連続学習日数計算
    streak = 0
    check_date = today
    for dg in sorted(daily_goals, key=lambda x: x.date, reverse=True):
        if dg.date == check_date and dg.actual_count > 0:
            streak += 1
            check_date = check_date - __import__("datetime").timedelta(days=1)
        elif dg.date < check_date:
            break

    return StudyPlanSummaryResponse(
        daysRemaining=days_remaining,
        totalAnswered=total_answered,
        totalCorrect=total_correct,
        accuracy=round(accuracy, 1),
        streak=streak,
        dailyProgress=[
            DailyProgressResponse(
                date=dg.date,
                targetCount=dg.target_count,
                actualCount=dg.actual_count,
                correctCount=dg.correct_count,
            )
            for dg in daily_goals
        ],
    )
