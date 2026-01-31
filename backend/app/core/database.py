"""データベース接続設定"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """データベースセッションを取得する依存関数"""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
