"""add content_hash for duplicate prevention

Revision ID: 003
Revises: 002
Create Date: 2025-02-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # questionsテーブルにcontent_hashを追加
    op.add_column(
        "questions",
        sa.Column(
            "content_hash",
            sa.String(length=32),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_questions_content_hash"),
        "questions",
        ["content_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_questions_content_hash"), table_name="questions")
    op.drop_column("questions", "content_hash")
