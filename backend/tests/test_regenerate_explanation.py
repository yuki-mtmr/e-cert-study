"""解説再生成APIエンドポイントのテスト"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database import get_db


class MockQuestion:
    """テスト用の問題モック"""

    def __init__(self, question_id: uuid.UUID | None = None) -> None:
        self.id = question_id or uuid.uuid4()
        self.category_id = uuid.uuid4()
        self.content = "活性化関数の役割は何か？"
        self.choices = ["入力データの正規化", "非線形性の導入", "損失関数の計算", "勾配の計算"]
        self.correct_answer = 1
        self.explanation = "古い解説テキスト"
        self.difficulty = 3
        self.source = "テスト問題集"
        self.content_type = "plain"
        self.images = []


class MockCategory:
    """テスト用のカテゴリモック"""

    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.name = "未分類"


class MockDBSession:
    """モックDBセッション"""

    def __init__(self) -> None:
        self._execute_results: list[MagicMock] = []
        self._call_count = 0

    def add_execute_result(self, result: MagicMock) -> None:
        self._execute_results.append(result)

    async def execute(self, query: object) -> MagicMock:
        if self._call_count < len(self._execute_results):
            result = self._execute_results[self._call_count]
            self._call_count += 1
            return result
        return MagicMock()

    def add(self, obj: object) -> None:
        pass

    async def commit(self) -> None:
        pass

    async def refresh(self, obj: object) -> None:
        pass


class TestRegenerateExplanationSingle:
    """個別解説再生成APIのテスト"""

    @pytest.mark.asyncio
    async def test_regenerate_explanation_success(self) -> None:
        """個別再生成が正常に動作する"""
        mock_question = MockQuestion()
        mock_db = MockDBSession()

        # 問題取得のクエリ結果
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_question
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        new_explanation = "### 正解を導く手順\n新しい解説"

        try:
            with patch(
                "app.api.questions.generate_explanation",
                new_callable=AsyncMock,
                return_value=new_explanation,
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    response = await client.post(
                        f"/api/questions/{mock_question.id}/regenerate-explanation"
                    )

                assert response.status_code == 200
                data = response.json()
                assert data["question_id"] == str(mock_question.id)
                assert data["explanation"] == new_explanation
                assert data["status"] == "success"
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_regenerate_explanation_not_found(self) -> None:
        """存在しない問題IDでは404を返す"""
        mock_db = MockDBSession()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    f"/api/questions/{uuid.uuid4()}/regenerate-explanation"
                )

            assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_regenerate_explanation_updates_db(self) -> None:
        """再生成後にDBが更新される"""
        mock_question = MockQuestion()
        mock_db = MockDBSession()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_question
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        new_explanation = "### 正解を導く手順\n更新された解説"

        try:
            with patch(
                "app.api.questions.generate_explanation",
                new_callable=AsyncMock,
                return_value=new_explanation,
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    await client.post(
                        f"/api/questions/{mock_question.id}/regenerate-explanation"
                    )

            # 問題の解説が更新されている
            assert mock_question.explanation == new_explanation
        finally:
            app.dependency_overrides.clear()


class TestRegenerateExplanationsBulk:
    """一括解説再生成APIのテスト"""

    @pytest.mark.asyncio
    async def test_regenerate_explanations_bulk_success(self) -> None:
        """一括再生成が正常に動作する"""
        mock_q1 = MockQuestion()
        mock_q2 = MockQuestion()
        mock_db = MockDBSession()

        # 問題一覧取得のクエリ結果
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_q1, mock_q2]
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            with patch(
                "app.api.questions.generate_explanation",
                new_callable=AsyncMock,
                return_value="### 正解を導く手順\n新しい解説",
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    response = await client.post(
                        "/api/questions/regenerate-explanations?limit=10"
                    )

                assert response.status_code == 200
                data = response.json()
                assert data["total"] == 2
                assert data["regenerated"] == 2
                assert data["failed"] == 0
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_regenerate_explanations_dry_run(self) -> None:
        """dry_run=trueの場合はDBを更新しない"""
        mock_question = MockQuestion()
        original_explanation = mock_question.explanation
        mock_db = MockDBSession()

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_question]
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            with patch(
                "app.api.questions.generate_explanation",
                new_callable=AsyncMock,
                return_value="### 正解を導く手順\n新しい解説",
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    response = await client.post(
                        "/api/questions/regenerate-explanations?dry_run=true"
                    )

                assert response.status_code == 200
                # dry_runなので解説は更新されない
                assert mock_question.explanation == original_explanation
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_regenerate_explanations_with_limit(self) -> None:
        """limitパラメータで処理数を制限できる"""
        mock_db = MockDBSession()

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/api/questions/regenerate-explanations?limit=5"
                )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 0
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_regenerate_explanations_handles_error(self) -> None:
        """個別の再生成エラーをハンドリングする"""
        mock_question = MockQuestion()
        mock_db = MockDBSession()

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_question]
        mock_db.add_execute_result(mock_result)

        async def override_get_db() -> AsyncGenerator[MockDBSession, None]:
            yield mock_db

        app.dependency_overrides[get_db] = override_get_db

        try:
            with patch(
                "app.api.questions.generate_explanation",
                new_callable=AsyncMock,
                side_effect=Exception("CLI Error"),
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as client:
                    response = await client.post(
                        "/api/questions/regenerate-explanations"
                    )

                assert response.status_code == 200
                data = response.json()
                assert data["total"] == 1
                assert data["regenerated"] == 0
                assert data["failed"] == 1
        finally:
            app.dependency_overrides.clear()
