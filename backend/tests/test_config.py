"""設定のテスト"""
import os

import pytest


def test_settings_default_values(monkeypatch: pytest.MonkeyPatch) -> None:
    """デフォルト設定値のテスト"""
    # 環境変数をクリアして新しいSettingsインスタンスを作成
    monkeypatch.delenv("DEBUG", raising=False)
    from app.core.config import Settings

    # _env_fileを無効化してデフォルト値をテスト
    settings = Settings(_env_file=None)  # type: ignore
    assert "postgresql" in settings.database_url
    assert settings.debug is False
    assert "http://localhost:3000" in settings.allowed_origins


def test_allowed_origins_includes_common_dev_ports(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """開発用ポートがCORS許可オリジンに含まれている"""
    from app.core.config import Settings

    settings = Settings(_env_file=None)  # type: ignore
    assert "http://localhost:3000" in settings.allowed_origins
    assert "http://localhost:3001" in settings.allowed_origins
    assert "http://localhost:3002" in settings.allowed_origins


def test_settings_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """環境変数から設定を読み込むテスト"""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    monkeypatch.setenv("GOOGLE_API_KEY", "test_api_key")
    monkeypatch.setenv("DEBUG", "true")

    from app.core.config import Settings

    settings = Settings()
    assert settings.database_url == "postgresql+asyncpg://test:test@localhost/test"
    assert settings.google_api_key == "test_api_key"
    assert settings.debug is True
