"""問題モデル"""
import hashlib
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


def compute_content_hash(content: str) -> str:
    """問題文のハッシュを計算

    Args:
        content: 問題文

    Returns:
        32文字のハッシュ値
    """
    return hashlib.sha256(content.encode()).hexdigest()[:32]

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
    content_hash: Mapped[Optional[str]] = mapped_column(
        String(32),
        nullable=True,
        index=True,
    )
    framework: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )
    topic: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
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
