"""add study plan tables

Revision ID: 004
Revises: 003
Create Date: 2026-02-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 学習プランテーブル
    op.create_table(
        "study_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=False),
        sa.Column("exam_date", sa.Date(), nullable=False),
        sa.Column("target_questions_per_day", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_study_plans_user_id"), "study_plans", ["user_id"], unique=False
    )

    # 日次目標テーブル
    op.create_table(
        "daily_goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("study_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("target_count", sa.Integer(), nullable=False),
        sa.Column("actual_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(
            ["study_plan_id"],
            ["study_plans.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_daily_goals_study_plan_id"), "daily_goals", ["study_plan_id"], unique=False
    )
    op.create_index(
        op.f("ix_daily_goals_date"), "daily_goals", ["date"], unique=False
    )


def downgrade() -> None:
    op.drop_table("daily_goals")
    op.drop_table("study_plans")
