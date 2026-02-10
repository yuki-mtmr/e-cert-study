"""チャットAPIエンドポイント"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.question import Question
from app.schemas.chat import ChatRequest
from app.services.chat_service import stream_chat_response

router = APIRouter(prefix="/api/questions", tags=["chat"])


@router.post("/{question_id}/chat")
async def chat_about_question(
    question_id: uuid.UUID,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """問題について追加質問するチャットエンドポイント

    Args:
        question_id: 問題ID
        request: チャットリクエスト（メッセージ + 会話履歴）

    Returns:
        SSEストリーミングレスポンス
    """
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="問題が見つかりません",
        )

    history = [{"role": msg.role, "content": msg.content} for msg in request.history]

    return StreamingResponse(
        stream_chat_response(
            question_content=question.content,
            choices=question.choices,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            history=history,
            user_message=request.message,
        ),
        media_type="text/event-stream",
    )
