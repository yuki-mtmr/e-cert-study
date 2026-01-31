"""問題モデル"""
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.answer import Answer
    from app.models.question_image import QuestionImage


class Question(Base):
    """問題"""

    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    correct_answer: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="plain",
    )

    # リレーションシップ
    category: Mapped["Category"] = relationship(
        "Category",
        back_populates="questions",
    )
    answers: Mapped[list["Answer"]] = relationship(
        "Answer",
        back_populates="question",
    )
    images: Mapped[list["QuestionImage"]] = relationship(
        "QuestionImage",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionImage.position",
    )
