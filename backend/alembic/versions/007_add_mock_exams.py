"""add mock_exams and mock_exam_answers tables

Revision ID: 007
Revises: 006
Create Date: 2026-02-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "mock_exams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("passed", sa.Boolean(), nullable=True),
        sa.Column("category_scores", postgresql.JSONB(), nullable=True),
        sa.Column("ai_analysis", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="in_progress"
        ),
    )
    op.create_index(
        op.f("ix_mock_exams_user_id"),
        "mock_exams",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "mock_exam_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "mock_exam_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mock_exams.id"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questions.id"),
            nullable=False,
        ),
        sa.Column("question_index", sa.Integer(), nullable=False),
        sa.Column("selected_answer", sa.Integer(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("category_name", sa.String(255), nullable=False),
        sa.Column("exam_area", sa.String(255), nullable=False),
    )
    op.create_index(
        op.f("ix_mock_exam_answers_mock_exam_id"),
        "mock_exam_answers",
        ["mock_exam_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_mock_exam_answers_mock_exam_id"), table_name="mock_exam_answers"
    )
    op.drop_table("mock_exam_answers")
    op.drop_index(op.f("ix_mock_exams_user_id"), table_name="mock_exams")
    op.drop_table("mock_exams")
