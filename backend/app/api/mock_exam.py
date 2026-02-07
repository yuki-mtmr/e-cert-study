"""模試APIエンドポイント"""
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.mock_exam import MockExam, MockExamAnswer
from app.models.question import Question
from app.schemas.mock_exam import (
    AIAnalysisResponse,
    CategoryScoreDetail,
    MockExamAnswerRequest,
    MockExamAnswerResponse,
    MockExamFinishRequest,
    MockExamHistoryItem,
    MockExamHistoryResponse,
    MockExamQuestionResponse,
    MockExamResultResponse,
    MockExamStartRequest,
    MockExamStartResponse,
)
from app.services.mock_exam_ai_analysis import generate_ai_analysis
from app.services.mock_exam_config import PASSING_THRESHOLD, TIME_LIMIT_MINUTES
from app.services.mock_exam_service import (
    calculate_scores,
    generate_rule_based_analysis,
    select_questions_for_exam,
)

router = APIRouter(prefix="/api/mock-exam", tags=["mock-exam"])


@router.post("/start", response_model=MockExamStartResponse)
async def start_mock_exam(
    request: MockExamStartRequest,
    db: AsyncSession = Depends(get_db),
) -> MockExamStartResponse:
    """模試を開始（100問生成、セッション作成）"""
    # 問題選択
    selected = await select_questions_for_exam(db)
    if not selected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="問題が不足しています。先に問題をインポートしてください。",
        )

    now = datetime.utcnow()
    exam_id = uuid.uuid4()

    # 模試セッション作成
    exam = MockExam(
        id=exam_id,
        user_id=request.user_id,
        started_at=now,
        total_questions=len(selected),
        status="in_progress",
    )
    db.add(exam)

    # 回答レコードを作成
    questions_response: list[MockExamQuestionResponse] = []
    for i, item in enumerate(selected):
        q = item["question"]
        answer = MockExamAnswer(
            id=uuid.uuid4(),
            mock_exam_id=exam_id,
            question_id=q.id,
            question_index=i,
            category_name=item["category_name"],
            exam_area=item["exam_area"],
        )
        db.add(answer)

        # 画像情報の変換
        images = []
        if hasattr(q, "images") and q.images:
            for img in q.images:
                images.append({
                    "id": str(img.id),
                    "question_id": str(img.question_id),
                    "file_path": img.file_path,
                    "alt_text": img.alt_text,
                    "position": img.position,
                    "image_type": getattr(img, "image_type", None),
                })

        questions_response.append(
            MockExamQuestionResponse(
                question_index=i,
                question_id=q.id,
                content=q.content,
                choices=q.choices,
                content_type=q.content_type or "plain",
                exam_area=item["exam_area"],
                images=images,
            )
        )

    await db.commit()

    return MockExamStartResponse(
        exam_id=exam_id,
        total_questions=len(selected),
        time_limit_minutes=TIME_LIMIT_MINUTES,
        questions=questions_response,
        started_at=now,
    )


@router.post("/{exam_id}/answer", response_model=MockExamAnswerResponse)
async def submit_answer(
    exam_id: uuid.UUID,
    request: MockExamAnswerRequest,
    db: AsyncSession = Depends(get_db),
) -> MockExamAnswerResponse:
    """回答送信（1問ずつ）"""
    # 模試を取得
    exam_result = await db.execute(
        select(MockExam).where(MockExam.id == exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="模試が見つかりません")
    if exam.status != "in_progress":
        raise HTTPException(status_code=400, detail="この模試は既に終了しています")

    # 対応する回答レコードを取得
    answer_result = await db.execute(
        select(MockExamAnswer).where(
            MockExamAnswer.mock_exam_id == exam_id,
            MockExamAnswer.question_index == request.question_index,
        )
    )
    answer = answer_result.scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    # 問題の正解を取得
    question_result = await db.execute(
        select(Question).where(Question.id == answer.question_id)
    )
    question = question_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="問題データが見つかりません")

    # 回答を記録
    is_correct = request.selected_answer == question.correct_answer
    answer.selected_answer = request.selected_answer
    answer.is_correct = is_correct
    answer.answered_at = datetime.utcnow()

    await db.commit()

    return MockExamAnswerResponse(
        question_index=request.question_index,
        is_correct=is_correct,
    )


@router.post("/{exam_id}/finish", response_model=MockExamResultResponse)
async def finish_mock_exam(
    exam_id: uuid.UUID,
    request: MockExamFinishRequest,
    db: AsyncSession = Depends(get_db),
) -> MockExamResultResponse:
    """模試終了（スコア計算・分析生成）"""
    exam_result = await db.execute(
        select(MockExam).where(MockExam.id == exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="模試が見つかりません")

    # 回答データを集計
    answers_data = []
    for a in exam.answers:
        answers_data.append({
            "is_correct": a.is_correct,
            "exam_area": a.exam_area,
        })

    # スコア計算
    scores = calculate_scores(answers_data)

    # ルールベース分析
    analysis = generate_rule_based_analysis(
        score=scores["score"],
        correct_count=scores["correct_count"],
        total=len(answers_data) if answers_data else exam.total_questions,
        passed=scores["passed"],
        category_scores=scores["category_scores"],
    )

    # 模試を更新
    now = datetime.utcnow()
    exam.finished_at = now
    exam.correct_count = scores["correct_count"]
    exam.score = scores["score"]
    exam.passed = scores["passed"]
    exam.category_scores = scores["category_scores"]
    exam.status = "finished"

    await db.commit()

    # レスポンス構築
    category_scores_list = [
        CategoryScoreDetail(
            area_name=area,
            total=detail["total"],
            correct=detail["correct"],
            accuracy=detail["accuracy"],
            grade=detail["grade"],
        )
        for area, detail in scores["category_scores"].items()
    ]

    return MockExamResultResponse(
        exam_id=exam.id,
        user_id=exam.user_id,
        started_at=exam.started_at,
        finished_at=now,
        total_questions=exam.total_questions,
        correct_count=scores["correct_count"],
        score=scores["score"],
        passed=scores["passed"],
        passing_threshold=PASSING_THRESHOLD,
        category_scores=category_scores_list,
        analysis=analysis,
        ai_analysis=exam.ai_analysis,
        status="finished",
    )


@router.get("/history", response_model=MockExamHistoryResponse)
async def get_mock_exam_history(
    user_id: str = Query(..., description="ユーザーID"),
    db: AsyncSession = Depends(get_db),
) -> MockExamHistoryResponse:
    """模試履歴一覧を取得"""
    exams_result = await db.execute(
        select(MockExam)
        .where(MockExam.user_id == user_id)
        .order_by(MockExam.started_at.desc())
    )
    exams = list(exams_result.scalars().all())

    count_result = await db.execute(
        select(func.count(MockExam.id)).where(MockExam.user_id == user_id)
    )
    total_count = count_result.scalar_one()

    items = [
        MockExamHistoryItem(
            exam_id=e.id,
            started_at=e.started_at,
            finished_at=e.finished_at,
            score=e.score,
            passed=e.passed,
            status=e.status,
        )
        for e in exams
    ]

    return MockExamHistoryResponse(exams=items, total_count=total_count)


@router.get("/{exam_id}", response_model=MockExamResultResponse)
async def get_mock_exam_result(
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MockExamResultResponse:
    """模試結果を取得"""
    exam_result = await db.execute(
        select(MockExam).where(MockExam.id == exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="模試が見つかりません")

    # カテゴリスコアをレスポンス形式に変換
    category_scores_list = []
    if exam.category_scores:
        for area, detail in exam.category_scores.items():
            category_scores_list.append(
                CategoryScoreDetail(
                    area_name=area,
                    total=detail.get("total", 0),
                    correct=detail.get("correct", 0),
                    accuracy=detail.get("accuracy", 0.0),
                    grade=detail.get("grade", "F"),
                )
            )

    # ルールベース分析を再生成
    analysis = ""
    if exam.status == "finished" and exam.category_scores:
        analysis = generate_rule_based_analysis(
            score=exam.score,
            correct_count=exam.correct_count,
            total=exam.total_questions,
            passed=exam.passed or False,
            category_scores=exam.category_scores,
        )

    return MockExamResultResponse(
        exam_id=exam.id,
        user_id=exam.user_id,
        started_at=exam.started_at,
        finished_at=exam.finished_at,
        total_questions=exam.total_questions,
        correct_count=exam.correct_count,
        score=exam.score,
        passed=exam.passed,
        passing_threshold=PASSING_THRESHOLD,
        category_scores=category_scores_list,
        analysis=analysis,
        ai_analysis=exam.ai_analysis,
        status=exam.status,
    )


@router.post("/{exam_id}/ai-analysis", response_model=AIAnalysisResponse)
async def request_ai_analysis(
    exam_id: uuid.UUID,
    request: MockExamFinishRequest,
    db: AsyncSession = Depends(get_db),
) -> AIAnalysisResponse:
    """AI分析を生成"""
    exam_result = await db.execute(
        select(MockExam).where(MockExam.id == exam_id)
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="模試が見つかりません")
    if exam.status != "finished":
        raise HTTPException(status_code=400, detail="模試が終了していません")

    # AI分析を生成
    ai_analysis = await generate_ai_analysis(
        score=exam.score,
        correct_count=exam.correct_count,
        total=exam.total_questions,
        passed=exam.passed or False,
        category_scores=exam.category_scores or {},
    )

    if ai_analysis:
        exam.ai_analysis = ai_analysis
        await db.commit()

    return AIAnalysisResponse(
        exam_id=exam.id,
        ai_analysis=ai_analysis or "AI分析の生成に失敗しました。後でもう一度お試しください。",
    )
