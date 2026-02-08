"""add review_items table

Revision ID: 006
Revises: 005
Create Date: 2026-02-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "review_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questions.id"),
            nullable=False,
        ),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="active"
        ),
        sa.Column("first_wrong_at", sa.DateTime(), nullable=False),
        sa.Column("last_answered_at", sa.DateTime(), nullable=False),
        sa.Column("mastered_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint(
            "question_id", "user_id", name="uq_review_items_question_user"
        ),
    )
    op.create_index(
        op.f("ix_review_items_user_id"),
        "review_items",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_review_items_status"),
        "review_items",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_review_items_user_id_status",
        "review_items",
        ["user_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_review_items_user_id_status", table_name="review_items")
    op.drop_index(op.f("ix_review_items_status"), table_name="review_items")
    op.drop_index(op.f("ix_review_items_user_id"), table_name="review_items")
    op.drop_table("review_items")
