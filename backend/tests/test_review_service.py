"""復習サービスのテスト"""
import uuid
from datetime import datetime
from typing import Any, Optional
from unittest.mock import MagicMock, AsyncMock, patch

import pytest

from app.models.review_item import ReviewItem
from app.services.review_service import (
    handle_incorrect_answer,
    handle_correct_answer,
    update_review_on_answer,
    get_active_review_items,
    get_mastered_items,
    get_review_stats,
    MASTERY_THRESHOLD,
)


class MockDBSession:
    """テスト用モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0
        self._added: list[Any] = []

    def set_execute_results(self, results: list[MagicMock]) -> None:
        self._execute_results = results
        self._call_count = 0

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()

    def add(self, obj: Any) -> None:
        self._added.append(obj)

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: Any) -> None:
        pass


class TestHandleIncorrectAnswer:
    """不正解時の処理テスト"""

    @pytest.mark.asyncio
    async def test_creates_new_review_item_when_not_exists(self) -> None:
        """既存のreview_itemがない場合、新規作成する"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        # 既存アイテムなし
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.set_execute_results([result_mock])

        item = await handle_incorrect_answer(db, question_id, user_id)

        assert item.question_id == question_id
        assert item.user_id == user_id
        assert item.correct_count == 0
        assert item.status == "active"
        assert len(db._added) == 1

    @pytest.mark.asyncio
    async def test_resets_correct_count_when_active_exists(self) -> None:
        """active状態の既存アイテムがある場合、correct_countをリセットする"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        existing = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=5,
            status="active",
            first_wrong_at=datetime.now(),
            last_answered_at=datetime.now(),
        )
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing
        db.set_execute_results([result_mock])

        item = await handle_incorrect_answer(db, question_id, user_id)

        assert item.correct_count == 0
        assert item.status == "active"

    @pytest.mark.asyncio
    async def test_reactivates_mastered_item(self) -> None:
        """mastered状態のアイテムを再活性化する"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        existing = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=10,
            status="mastered",
            first_wrong_at=datetime.now(),
            last_answered_at=datetime.now(),
            mastered_at=datetime.now(),
        )
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing
        db.set_execute_results([result_mock])

        item = await handle_incorrect_answer(db, question_id, user_id)

        assert item.correct_count == 0
        assert item.status == "active"
        assert item.mastered_at is None


class TestHandleCorrectAnswer:
    """正解時の処理テスト"""

    @pytest.mark.asyncio
    async def test_returns_none_when_no_active_item(self) -> None:
        """active状態のアイテムがない場合Noneを返す"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.set_execute_results([result_mock])

        item = await handle_correct_answer(db, question_id, user_id)

        assert item is None

    @pytest.mark.asyncio
    async def test_increments_correct_count(self) -> None:
        """正解でcorrect_countがインクリメントされる"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        existing = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=3,
            status="active",
            first_wrong_at=datetime.now(),
            last_answered_at=datetime.now(),
        )
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing
        db.set_execute_results([result_mock])

        item = await handle_correct_answer(db, question_id, user_id)

        assert item is not None
        assert item.correct_count == 4
        assert item.status == "active"

    @pytest.mark.asyncio
    async def test_masters_item_at_threshold(self) -> None:
        """閾値到達で習得済みになる"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        existing = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=MASTERY_THRESHOLD - 1,
            status="active",
            first_wrong_at=datetime.now(),
            last_answered_at=datetime.now(),
        )
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing
        db.set_execute_results([result_mock])

        item = await handle_correct_answer(db, question_id, user_id)

        assert item is not None
        assert item.correct_count == MASTERY_THRESHOLD
        assert item.status == "mastered"
        assert item.mastered_at is not None

    @pytest.mark.asyncio
    async def test_does_not_master_below_threshold(self) -> None:
        """閾値未満ではまだactive"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        existing = ReviewItem(
            id=uuid.uuid4(),
            question_id=question_id,
            user_id=user_id,
            correct_count=MASTERY_THRESHOLD - 2,
            status="active",
            first_wrong_at=datetime.now(),
            last_answered_at=datetime.now(),
        )
        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = existing
        db.set_execute_results([result_mock])

        item = await handle_correct_answer(db, question_id, user_id)

        assert item is not None
        assert item.correct_count == MASTERY_THRESHOLD - 1
        assert item.status == "active"
        assert item.mastered_at is None


class TestUpdateReviewOnAnswer:
    """統合ディスパッチ関数のテスト"""

    @pytest.mark.asyncio
    async def test_delegates_to_incorrect_handler(self) -> None:
        """不正解時にhandle_incorrect_answerに委譲する"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        db.set_execute_results([result_mock])

        with patch(
            "app.services.review_service.handle_incorrect_answer"
        ) as mock_handler:
            mock_handler.return_value = ReviewItem(
                id=uuid.uuid4(),
                question_id=question_id,
                user_id=user_id,
                correct_count=0,
                status="active",
                first_wrong_at=datetime.now(),
                last_answered_at=datetime.now(),
            )
            await update_review_on_answer(db, question_id, user_id, False)
            mock_handler.assert_called_once_with(db, question_id, user_id)

    @pytest.mark.asyncio
    async def test_delegates_to_correct_handler(self) -> None:
        """正解時にhandle_correct_answerに委譲する"""
        db = MockDBSession()
        question_id = uuid.uuid4()
        user_id = "test_user"

        with patch(
            "app.services.review_service.handle_correct_answer"
        ) as mock_handler:
            mock_handler.return_value = None
            await update_review_on_answer(db, question_id, user_id, True)
            mock_handler.assert_called_once_with(db, question_id, user_id)


class TestGetActiveReviewItems:
    """復習キュー取得のテスト"""

    @pytest.mark.asyncio
    async def test_returns_active_items(self) -> None:
        """active状態のアイテムを返す"""
        db = MockDBSession()

        items = [
            ReviewItem(
                id=uuid.uuid4(),
                question_id=uuid.uuid4(),
                user_id="test_user",
                correct_count=3,
                status="active",
                first_wrong_at=datetime.now(),
                last_answered_at=datetime.now(),
            ),
        ]
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = items
        db.set_execute_results([result_mock])

        result = await get_active_review_items(db, "test_user")
        assert len(result) == 1
        assert result[0].status == "active"


class TestGetMasteredItems:
    """習得済み取得のテスト"""

    @pytest.mark.asyncio
    async def test_returns_mastered_items(self) -> None:
        """mastered状態のアイテムを返す"""
        db = MockDBSession()

        items = [
            ReviewItem(
                id=uuid.uuid4(),
                question_id=uuid.uuid4(),
                user_id="test_user",
                correct_count=10,
                status="mastered",
                first_wrong_at=datetime.now(),
                last_answered_at=datetime.now(),
                mastered_at=datetime.now(),
            ),
        ]
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = items
        db.set_execute_results([result_mock])

        result = await get_mastered_items(db, "test_user")
        assert len(result) == 1
        assert result[0].status == "mastered"


class TestGetReviewStats:
    """統計取得のテスト"""

    @pytest.mark.asyncio
    async def test_returns_stats(self) -> None:
        """統計情報を返す"""
        db = MockDBSession()

        # active_count
        active_result = MagicMock()
        active_result.scalar.return_value = 5

        # mastered_count
        mastered_result = MagicMock()
        mastered_result.scalar.return_value = 3

        db.set_execute_results([active_result, mastered_result])

        stats = await get_review_stats(db, "test_user")
        assert stats["active_count"] == 5
        assert stats["mastered_count"] == 3
        assert stats["total_count"] == 8
