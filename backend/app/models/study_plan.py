"""学習プランモデル"""
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class StudyPlan(Base):
    """学習プラン"""

    __tablename__ = "study_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_questions_per_day: Mapped[int] = mapped_column(
        Integer, nullable=False, default=20
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # リレーションシップ
    daily_goals: Mapped[List["DailyGoal"]] = relationship(
        "DailyGoal",
        back_populates="study_plan",
        cascade="all, delete-orphan",
    )


class DailyGoal(Base):
    """日次目標"""

    __tablename__ = "daily_goals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    study_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_plans.id"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # リレーションシップ
    study_plan: Mapped["StudyPlan"] = relationship(
        "StudyPlan",
        back_populates="daily_goals",
    )
