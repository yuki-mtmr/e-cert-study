"""SQLAlchemyベースモデル"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """全モデルの基底クラス"""

    pass
