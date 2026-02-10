"""Alembic マイグレーション環境設定"""
import os
import re
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL

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

# 環境変数からデータベースURLを取得
raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql://user:pass@localhost:5432/e_cert_study",
)
# alembicは同期ドライバを使用するため、asyncpgを除去
raw_url = raw_url.replace("+asyncpg", "")

# パスワードに特殊文字（#等）が含まれる場合に対応するため、URL.createで構築
match = re.match(r"(\w+):\/\/([^:]+):(.+)@([^:\/]+):(\d+)\/(.+)", raw_url)
if match:
    database_url = URL.create(
        drivername=match.group(1),
        username=match.group(2),
        password=match.group(3),
        host=match.group(4),
        port=int(match.group(5)),
        database=match.group(6),
    )
else:
    database_url = raw_url

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
    connectable = create_engine(database_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
