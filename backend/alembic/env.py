"""Alembic マイグレーション環境設定"""
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from app.models.base import Base
from app.models.category import Category  # noqa: F401
from app.models.question import Question  # noqa: F401
from app.models.answer import Answer  # noqa: F401

# Alembic Configオブジェクト
config = context.config

# ロギング設定
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 環境変数からデータベースURLを取得（asyncpg部分を標準ドライバに置換）
database_url = os.getenv(
    "DATABASE_URL",
    "postgresql://user:pass@localhost:5432/e_cert_study",
)
# alembicは同期ドライバを使用するため、asyncpgをpsycopg2に置換
database_url = database_url.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", database_url)

# モデルのメタデータ
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """オフラインモードでマイグレーション実行"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """オンラインモードでマイグレーション実行"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
