"""add unique constraint to question_images (question_id, file_path)

Revision ID: 008
Revises: 007
Create Date: 2026-02-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # question_imagesテーブルが存在するか確認
    if "question_images" not in inspector.get_table_names():
        return

    # 既存の重複レコードを削除（id が大きいほうを残す）
    conn.execute(text("""
        DELETE FROM question_images
        WHERE id IN (
            SELECT id FROM (
                SELECT id,
                    ROW_NUMBER() OVER (
                        PARTITION BY question_id, file_path
                        ORDER BY id
                    ) AS rn
                FROM question_images
            ) sub
            WHERE rn > 1
        )
    """))

    # 既存の制約があるか確認
    existing_constraints = [
        c["name"] for c in inspector.get_unique_constraints("question_images")
    ]
    if "uq_question_image_path" not in existing_constraints:
        op.create_unique_constraint(
            "uq_question_image_path",
            "question_images",
            ["question_id", "file_path"],
        )


def downgrade() -> None:
    op.drop_constraint(
        "uq_question_image_path",
        "question_images",
        type_="unique",
    )
