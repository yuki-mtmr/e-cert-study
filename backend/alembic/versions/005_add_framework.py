"""add framework column to questions

Revision ID: 005
Revises: 004
Create Date: 2026-02-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "questions",
        sa.Column(
            "framework",
            sa.String(length=50),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_questions_framework"),
        "questions",
        ["framework"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_questions_framework"), table_name="questions")
    op.drop_column("questions", "framework")
