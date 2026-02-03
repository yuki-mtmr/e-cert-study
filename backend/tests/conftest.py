"""テスト共通設定

テスト実行時の安全性を確保するための設定:
1. テスト環境であることを明示的にチェック
2. 本番DBへの誤接続を防止
"""
import os

import pytest


def pytest_configure(config: pytest.Config) -> None:
    """pytest起動時の設定

    テスト環境であることを確認し、本番環境での実行を防止する。
    """
    # 環境変数でテストモードを明示
    os.environ["TESTING"] = "1"

    # 本番環境フラグが設定されている場合は警告
    if os.environ.get("IS_PRODUCTION", "").lower() == "true":
        pytest.exit(
            "ERROR: テストを本番環境で実行しようとしています。\n"
            "IS_PRODUCTION=false を設定してから再実行してください。",
            returncode=1,
        )


def pytest_unconfigure(config: pytest.Config) -> None:
    """pytest終了時のクリーンアップ"""
    if "TESTING" in os.environ:
        del os.environ["TESTING"]


@pytest.fixture(autouse=True)
def check_test_environment() -> None:
    """各テスト実行前にテスト環境であることを確認

    本番DBへの誤接続を防ぐためのセーフガード。
    """
    # DATABASE_URLが本番っぽい場合は警告
    db_url = os.environ.get("DATABASE_URL", "")
    dangerous_hosts = ["supabase", "amazonaws", "azure", "production", "prod"]

    for host in dangerous_hosts:
        if host in db_url.lower():
            pytest.skip(
                f"WARNING: DATABASE_URLに本番環境と思われるホスト({host})が含まれています。"
                "テストをスキップします。"
            )
