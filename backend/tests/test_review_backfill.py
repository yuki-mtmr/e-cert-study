"""バックフィル（既存模試の遡及処理）のテスト"""
import uuid
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.mock_exam import MockExam, MockExamAnswer


def _make_finished_exam(
    user_id: str = "test_user",
    answers_data: list[dict] | None = None,
) -> MockExam:
    """完了済み模試を作成"""
    exam = MockExam(
        id=uuid.uuid4(),
        user_id=user_id,
        started_at=datetime.utcnow(),
        finished_at=datetime.utcnow(),
        total_questions=3,
        correct_count=1,
        score=33.3,
        passed=False,
        status="finished",
    )
    if answers_data is None:
        answers_data = [
            {"is_correct": False, "exam_area": "機械学習"},
            {"is_correct": True, "exam_area": "深層学習の基礎"},
            {"is_correct": False, "exam_area": "応用数学"},
        ]
    exam.answers = []
    for i, ad in enumerate(answers_data):
        exam.answers.append(MockExamAnswer(
            id=uuid.uuid4(),
            mock_exam_id=exam.id,
            question_id=uuid.uuid4(),
            question_index=i,
            selected_answer=1,
            is_correct=ad["is_correct"],
            answered_at=datetime.utcnow(),
            category_name=ad["exam_area"],
            exam_area=ad["exam_area"],
        ))
    return exam


def _make_in_progress_exam(user_id: str = "test_user") -> MockExam:
    """進行中の模試を作成"""
    exam = MockExam(
        id=uuid.uuid4(),
        user_id=user_id,
        started_at=datetime.utcnow(),
        total_questions=3,
        status="in_progress",
    )
    exam.answers = []
    return exam


class MockScalarsAll:
    """db.execute().scalars().all() をモック"""

    def __init__(self, items: list[Any]) -> None:
        self._items = items

    def scalars(self) -> "MockScalarsAll":
        return self

    def all(self) -> list[Any]:
        return self._items


@pytest.mark.asyncio
async def test_backfill_processes_finished_exams() -> None:
    """完了済み模試の不正解が復習アイテムに追加される"""
    exam = _make_finished_exam()

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([exam]))

    with patch(
        "app.services.review_service.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = None

        from app.services.review_service import backfill_review_items_for_user

        result = await backfill_review_items_for_user(mock_db, "test_user")

        assert result["exams_processed"] == 1
        # 3問全てに対して呼ばれる（不正解2 + 正解1）
        assert mock_update.call_count == 3


@pytest.mark.asyncio
async def test_backfill_skips_in_progress_exams() -> None:
    """in_progress の模試はスキップされる"""
    finished = _make_finished_exam()
    in_progress = _make_in_progress_exam()

    mock_db = MagicMock()
    # クエリはstatus="finished"でフィルタするので、finishedのみ返す
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([finished]))

    with patch(
        "app.services.review_service.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = None

        from app.services.review_service import backfill_review_items_for_user

        result = await backfill_review_items_for_user(mock_db, "test_user")

        # finishedのみ処理
        assert result["exams_processed"] == 1


@pytest.mark.asyncio
async def test_backfill_idempotent() -> None:
    """2回実行しても結果が同じ（冪等性）"""
    exam = _make_finished_exam()

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([exam]))

    with patch(
        "app.services.review_service.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = None

        from app.services.review_service import backfill_review_items_for_user

        result1 = await backfill_review_items_for_user(mock_db, "test_user")
        result2 = await backfill_review_items_for_user(mock_db, "test_user")

        # 同じ結果
        assert result1["exams_processed"] == result2["exams_processed"]


@pytest.mark.asyncio
async def test_backfill_no_finished_exams() -> None:
    """完了済み模試がない場合"""
    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([]))

    with patch(
        "app.services.review_service.update_review_on_answer",
        new_callable=AsyncMock,
    ):
        from app.services.review_service import backfill_review_items_for_user

        result = await backfill_review_items_for_user(mock_db, "test_user")

        assert result["exams_processed"] == 0
        assert result["items_created"] == 0


@pytest.mark.asyncio
async def test_backfill_endpoint_commits_to_db() -> None:
    """バックフィルAPIエンドポイントが db.commit() を呼ぶ"""
    exam = _make_finished_exam()

    mock_db = MagicMock()
    mock_db.execute = AsyncMock(return_value=MockScalarsAll([exam]))
    mock_db.commit = AsyncMock()

    with patch(
        "app.services.review_service.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_update:
        mock_update.return_value = None

        from app.api.review import backfill_review_items
        from app.schemas.review import BackfillRequest

        request = BackfillRequest(user_id="test_user")
        await backfill_review_items(request, mock_db)

        # db.commit() が呼ばれていること
        mock_db.commit.assert_awaited_once()
