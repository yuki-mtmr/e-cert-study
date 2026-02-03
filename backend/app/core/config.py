"""アプリケーション設定"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """環境変数から設定を読み込む"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # データベース
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/e_cert_study"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""
    supabase_bucket_name: str = "question-images"

    # CORS - 開発用とデプロイ先
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        # 本番環境（Vercel）
        "https://e-cert-study.vercel.app",
        "https://e-cert-study-bg9uguen4-matts-projects-d5aa6f04.vercel.app",
    ]

    # 環境変数で追加のオリジンを指定可能（カンマ区切り）
    extra_allowed_origins: str = ""

    # API Keys
    google_api_key: str = ""

    # アプリ設定
    debug: bool = False

    # 本番環境フラグ（Trueの場合、PDFインポート機能を無効化）
    is_production: bool = False


settings = Settings()
