"""add images support

Revision ID: 002
Revises: 001
Create Date: 2025-01-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # questionsテーブルにcontent_typeを追加
    op.add_column(
        "questions",
        sa.Column(
            "content_type",
            sa.String(length=50),
            nullable=False,
            server_default="plain",
        ),
    )

    # question_imagesテーブルを作成
    op.create_table(
        "question_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("alt_text", sa.Text(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("image_type", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["questions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_question_images_question_id"),
        "question_images",
        ["question_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_question_images_position"),
        "question_images",
        ["position"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("question_images")
    op.drop_column("questions", "content_type")
