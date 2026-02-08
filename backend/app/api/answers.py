"""回答APIエンドポイント"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.answer import Answer
from app.models.question import Question
from app.schemas.answer import AnswerCreate, AnswerResponse
from app.services.review_service import update_review_on_answer

router = APIRouter(prefix="/api/answers", tags=["answers"])


async def get_answers_service(
    db: AsyncSession,
    user_id: Optional[str] = None,
    question_id: Optional[uuid.UUID] = None,
    limit: int = 100,
) -> list[Answer]:
    """回答履歴を取得するサービス"""
    query = select(Answer)
    if user_id:
        query = query.where(Answer.user_id == user_id)
    if question_id:
        query = query.where(Answer.question_id == question_id)
    query = query.order_by(Answer.answered_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_answer_service(
    db: AsyncSession,
    answer_data: AnswerCreate,
) -> Answer:
    """回答を作成するサービス"""
    # 問題を取得して正誤判定
    result = await db.execute(
        select(Question).where(Question.id == answer_data.question_id)
    )
    question = result.scalar_one_or_none()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    is_correct = answer_data.selected_answer == question.correct_answer

    answer = Answer(
        id=uuid.uuid4(),
        question_id=answer_data.question_id,
        user_id=answer_data.user_id,
        selected_answer=answer_data.selected_answer,
        is_correct=is_correct,
        answered_at=datetime.now(),
    )
    db.add(answer)

    # 復習アイテムを更新
    await update_review_on_answer(
        db, answer.question_id, answer.user_id, is_correct
    )

    await db.commit()
    await db.refresh(answer)
    return answer


@router.get("", response_model=list[AnswerResponse])
async def get_answers(
    user_id: Optional[str] = None,
    question_id: Optional[uuid.UUID] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[Answer]:
    """回答履歴を取得"""
    return await get_answers_service(db, user_id, question_id, limit)


@router.get("/history", response_model=list[AnswerResponse])
async def get_answer_history(
    user_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> list[Answer]:
    """ユーザーの回答履歴を取得"""
    return await get_answers_service(db, user_id=user_id, limit=limit)


@router.post("", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    answer_data: AnswerCreate,
    db: AsyncSession = Depends(get_db),
) -> Answer:
    """回答を送信"""
    return await create_answer_service(db, answer_data)
