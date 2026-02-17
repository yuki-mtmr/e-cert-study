"""add topic column to questions and mock_exam_answers

Revision ID: 009
Revises: 008
Create Date: 2026-02-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "questions",
        sa.Column("topic", sa.String(length=100), nullable=True),
    )
    op.create_index(
        op.f("ix_questions_topic"),
        "questions",
        ["topic"],
        unique=False,
    )
    op.add_column(
        "mock_exam_answers",
        sa.Column("topic", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("mock_exam_answers", "topic")
    op.drop_index(op.f("ix_questions_topic"), table_name="questions")
    op.drop_column("questions", "topic")
