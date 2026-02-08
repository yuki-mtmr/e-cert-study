"""復習アイテムモデルのテスト"""
import uuid
from datetime import datetime

import pytest

from app.models.review_item import ReviewItem


class TestReviewItemModel:
    """ReviewItemモデルのテスト"""

    def test_review_item_has_required_fields(self) -> None:
        """全フィールドが存在することを確認"""
        now = datetime.now()
        item = ReviewItem(
            id=uuid.uuid4(),
            question_id=uuid.uuid4(),
            user_id="local_user_123",
            correct_count=0,
            status="active",
            first_wrong_at=now,
            last_answered_at=now,
        )
        assert item.id is not None
        assert item.question_id is not None
        assert item.user_id == "local_user_123"
        assert item.correct_count == 0
        assert item.status == "active"
        assert item.first_wrong_at == now
        assert item.last_answered_at == now
        assert item.mastered_at is None

    def test_review_item_mastered_status(self) -> None:
        """mastered状態を設定できることを確認"""
        now = datetime.now()
        item = ReviewItem(
            id=uuid.uuid4(),
            question_id=uuid.uuid4(),
            user_id="local_user_123",
            correct_count=10,
            status="mastered",
            first_wrong_at=now,
            last_answered_at=now,
            mastered_at=now,
        )
        assert item.status == "mastered"
        assert item.mastered_at == now
        assert item.correct_count == 10

    def test_review_item_default_values(self) -> None:
        """デフォルト値がDB挿入時に正しく設定されることを確認

        SQLAlchemyのdefaultはDB INSERT時に適用されるため、
        Pythonオブジェクト生成時にはNoneになる。
        ここではカラム定義のdefault設定を確認する。
        """
        # correct_countのカラムdefault確認
        col = ReviewItem.__table__.columns["correct_count"]
        assert col.default.arg == 0

        # statusのカラムdefault確認
        col_status = ReviewItem.__table__.columns["status"]
        assert col_status.default.arg == "active"

        # mastered_atはnullable
        col_mastered = ReviewItem.__table__.columns["mastered_at"]
        assert col_mastered.nullable is True
