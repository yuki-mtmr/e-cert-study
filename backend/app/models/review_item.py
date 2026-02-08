"""復習アイテムモデル"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.question import Question


class ReviewItem(Base):
    """復習アイテム: 間違えた問題の追跡と習得管理"""

    __tablename__ = "review_items"
    __table_args__ = (
        UniqueConstraint(
            "question_id", "user_id", name="uq_review_items_question_user"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questions.id"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    correct_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active"
    )
    first_wrong_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )
    last_answered_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False
    )
    mastered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, default=None
    )

    # リレーションシップ
    question: Mapped["Question"] = relationship("Question")
