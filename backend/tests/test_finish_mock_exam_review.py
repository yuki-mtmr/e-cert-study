"""finish_mock_exam → 復習アイテム連携のテスト"""
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.mock_exam import MockExam, MockExamAnswer
from app.services.review_service import update_review_on_answer


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0
        self._added: list[object] = []
        self._committed = False

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()

    def add(self, obj: object) -> None:
        self._added.append(obj)

    async def commit(self) -> None:
        self._committed = True

    async def refresh(self, obj: object) -> None:
        pass


def _make_exam_with_answers(
    user_id: str = "test_user",
    answers_data: list[dict] | None = None,
) -> MockExam:
    """テスト用の模試とその回答を作成"""
    exam = MockExam(
        id=uuid.uuid4(),
        user_id=user_id,
        started_at=datetime.utcnow(),
        total_questions=3,
        status="in_progress",
    )

    if answers_data is None:
        answers_data = [
            {"is_correct": False, "exam_area": "機械学習"},
            {"is_correct": True, "exam_area": "深層学習の基礎"},
            {"is_correct": None, "exam_area": "応用数学"},
        ]

    exam.answers = []
    for i, ad in enumerate(answers_data):
        answer = MockExamAnswer(
            id=uuid.uuid4(),
            mock_exam_id=exam.id,
            question_id=uuid.uuid4(),
            question_index=i,
            selected_answer=1 if ad["is_correct"] is not None else None,
            is_correct=ad["is_correct"],
            answered_at=datetime.utcnow() if ad["is_correct"] is not None else None,
            category_name=ad["exam_area"],
            exam_area=ad["exam_area"],
        )
        exam.answers.append(answer)

    return exam


@pytest.mark.asyncio
async def test_finish_mock_exam_calls_update_review_for_incorrect() -> None:
    """不正解の回答に対して update_review_on_answer が呼ばれる"""
    exam = _make_exam_with_answers(answers_data=[
        {"is_correct": False, "exam_area": "機械学習"},
        {"is_correct": True, "exam_area": "深層学習の基礎"},
    ])

    with patch(
        "app.api.mock_exam.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_review:
        mock_review.return_value = None

        # finish_mock_exam のインポートと呼出し
        from app.api.mock_exam import finish_mock_exam
        from app.schemas.mock_exam import MockExamFinishRequest

        # exam取得のモック
        mock_db = MockDBSession()
        exam_result = MagicMock()
        exam_result.scalar_one_or_none.return_value = exam
        mock_db.set_execute_results([exam_result])

        request = MockExamFinishRequest(user_id=exam.user_id)
        await finish_mock_exam(exam.id, request, mock_db)

        # 2回呼ばれる（不正解1回 + 正解1回）
        assert mock_review.call_count == 2

        # 不正解の呼び出しを確認
        calls = mock_review.call_args_list
        incorrect_call = calls[0]
        assert incorrect_call.args[1] == exam.answers[0].question_id
        assert incorrect_call.args[2] == exam.user_id
        assert incorrect_call.args[3] is False

        # 正解の呼び出しを確認
        correct_call = calls[1]
        assert correct_call.args[1] == exam.answers[1].question_id
        assert correct_call.args[2] == exam.user_id
        assert correct_call.args[3] is True


@pytest.mark.asyncio
async def test_finish_mock_exam_calls_update_review_for_correct() -> None:
    """正解の回答に対して update_review_on_answer が呼ばれ correct_count が加算される"""
    exam = _make_exam_with_answers(answers_data=[
        {"is_correct": True, "exam_area": "深層学習の基礎"},
    ])

    with patch(
        "app.api.mock_exam.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_review:
        mock_review.return_value = None

        from app.api.mock_exam import finish_mock_exam
        from app.schemas.mock_exam import MockExamFinishRequest

        mock_db = MockDBSession()
        exam_result = MagicMock()
        exam_result.scalar_one_or_none.return_value = exam
        mock_db.set_execute_results([exam_result])

        request = MockExamFinishRequest(user_id=exam.user_id)
        await finish_mock_exam(exam.id, request, mock_db)

        # 正解に対して呼ばれる
        assert mock_review.call_count == 1
        call = mock_review.call_args_list[0]
        assert call.args[3] is True


@pytest.mark.asyncio
async def test_finish_mock_exam_skips_unanswered() -> None:
    """未回答（is_correct=None）の回答はスキップされる"""
    exam = _make_exam_with_answers(answers_data=[
        {"is_correct": None, "exam_area": "応用数学"},
        {"is_correct": None, "exam_area": "機械学習"},
    ])

    with patch(
        "app.api.mock_exam.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_review:
        from app.api.mock_exam import finish_mock_exam
        from app.schemas.mock_exam import MockExamFinishRequest

        mock_db = MockDBSession()
        exam_result = MagicMock()
        exam_result.scalar_one_or_none.return_value = exam
        mock_db.set_execute_results([exam_result])

        request = MockExamFinishRequest(user_id=exam.user_id)
        await finish_mock_exam(exam.id, request, mock_db)

        # 未回答はスキップ
        assert mock_review.call_count == 0


@pytest.mark.asyncio
async def test_finish_mock_exam_mixed_answers() -> None:
    """混合パターン: 不正解・正解・未回答が正しく処理される"""
    exam = _make_exam_with_answers(answers_data=[
        {"is_correct": False, "exam_area": "機械学習"},
        {"is_correct": True, "exam_area": "深層学習の基礎"},
        {"is_correct": None, "exam_area": "応用数学"},
    ])

    with patch(
        "app.api.mock_exam.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_review:
        mock_review.return_value = None

        from app.api.mock_exam import finish_mock_exam
        from app.schemas.mock_exam import MockExamFinishRequest

        mock_db = MockDBSession()
        exam_result = MagicMock()
        exam_result.scalar_one_or_none.return_value = exam
        mock_db.set_execute_results([exam_result])

        request = MockExamFinishRequest(user_id=exam.user_id)
        await finish_mock_exam(exam.id, request, mock_db)

        # 不正解1回 + 正解1回 = 2回（未回答はスキップ）
        assert mock_review.call_count == 2


@pytest.mark.asyncio
async def test_finish_mock_exam_review_error_does_not_break_result() -> None:
    """復習アイテム更新で例外が発生しても模試結果は正常に返される"""
    exam = _make_exam_with_answers(answers_data=[
        {"is_correct": False, "exam_area": "機械学習"},
        {"is_correct": True, "exam_area": "深層学習の基礎"},
    ])

    with patch(
        "app.api.mock_exam.update_review_on_answer",
        new_callable=AsyncMock,
    ) as mock_review:
        # 全ての呼び出しで例外を発生させる
        mock_review.side_effect = Exception("DB接続エラー")

        from app.api.mock_exam import finish_mock_exam
        from app.schemas.mock_exam import MockExamFinishRequest

        mock_db = MockDBSession()
        exam_result = MagicMock()
        exam_result.scalar_one_or_none.return_value = exam
        mock_db.set_execute_results([exam_result])

        request = MockExamFinishRequest(user_id=exam.user_id)
        # 例外が発生しても正常にレスポンスが返る
        result = await finish_mock_exam(exam.id, request, mock_db)

        assert result.status == "finished"
        assert result.score is not None
        # commitが呼ばれた（模試結果が保存された）
        assert mock_db._committed is True
