"""問題-画像紐付け更新スクリプトのテスト"""
import json
import uuid

import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock


class TestLoadMatchesFromJson:
    """マッチングデータ読み込みのテスト"""

    def test_load_matches_from_json(self, tmp_path):
        """JSONファイルからマッチングデータを読み込めること"""
        from scripts.update_question_images import load_matches_from_json

        matches_data = [
            {"question_id": "q1", "image_xref": 100, "score": 0.85},
            {"question_id": "q2", "image_xref": 101, "score": 0.72},
        ]

        json_path = tmp_path / "matches.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(matches_data, f)

        result = load_matches_from_json(str(json_path))

        assert len(result) == 2
        assert result[0]["question_id"] == "q1"

    def test_load_matches_handles_missing_file(self):
        """存在しないファイルでエラーが発生すること"""
        from scripts.update_question_images import load_matches_from_json

        with pytest.raises(FileNotFoundError):
            load_matches_from_json("/path/to/nonexistent.json")


class TestUpdateQuestionImages:
    """更新関数のテスト"""

    @pytest.mark.asyncio
    async def test_update_with_missing_images_dir(self, tmp_path):
        """画像ディレクトリが存在しない場合のエラー処理"""
        from scripts.update_question_images import update_question_images

        # マッチングファイルを作成
        matches_path = tmp_path / "matches.json"
        with open(matches_path, "w", encoding="utf-8") as f:
            json.dump([{"question_id": "q1", "image_xref": 100}], f)

        result = await update_question_images(
            matches_path=str(matches_path),
            images_dir="/nonexistent/dir",
            dry_run=True,
        )

        assert "error" in result
        assert result["updated"] == 0

    @pytest.mark.asyncio
    async def test_update_with_dry_run(self, tmp_path):
        """dry_runモードでは実際に更新しないこと"""
        from scripts.update_question_images import update_question_images

        # マッチングファイルを作成
        matches_path = tmp_path / "matches.json"
        matches_data = [
            {"question_id": "q1", "image_xref": 100, "image_page": 0},
            {"question_id": "q2", "image_xref": 101, "image_page": 1},
        ]
        with open(matches_path, "w", encoding="utf-8") as f:
            json.dump(matches_data, f)

        # 画像ディレクトリを作成
        images_dir = tmp_path / "images"
        images_dir.mkdir()

        # テスト用画像ファイルを作成
        (images_dir / "page0_xref100.png").write_bytes(b"fake image")

        result = await update_question_images(
            matches_path=str(matches_path),
            images_dir=str(images_dir),
            dry_run=True,
        )

        assert result["total_matches"] == 2
        assert result["images_found"] == 1
        assert result["images_missing"] == 1
        assert result["updated"] == 0  # dry_runなので更新なし

    @pytest.mark.asyncio
    async def test_update_finds_images_with_alt_naming(self, tmp_path):
        """別の命名規則の画像も見つけられること"""
        from scripts.update_question_images import update_question_images

        matches_path = tmp_path / "matches.json"
        matches_data = [
            {"question_id": "q1", "image_xref": 100, "image_page": 0},
        ]
        with open(matches_path, "w", encoding="utf-8") as f:
            json.dump(matches_data, f)

        images_dir = tmp_path / "images"
        images_dir.mkdir()

        # 別の命名規則でファイルを作成
        (images_dir / "image_100.png").write_bytes(b"fake image")

        result = await update_question_images(
            matches_path=str(matches_path),
            images_dir=str(images_dir),
            dry_run=True,
        )

        assert result["images_found"] == 1

    @pytest.mark.asyncio
    async def test_update_empty_matches(self, tmp_path):
        """空のマッチングデータを処理できること"""
        from scripts.update_question_images import update_question_images

        matches_path = tmp_path / "matches.json"
        with open(matches_path, "w", encoding="utf-8") as f:
            json.dump([], f)

        images_dir = tmp_path / "images"
        images_dir.mkdir()

        result = await update_question_images(
            matches_path=str(matches_path),
            images_dir=str(images_dir),
            dry_run=True,
        )

        assert result["total_matches"] == 0
        assert result["images_found"] == 0


class TestCopyImageToStatic:
    """画像コピー機能のテスト"""

    def test_copy_image_success(self, tmp_path):
        """画像ファイルを正常にコピーできること"""
        from scripts.update_question_images import copy_image_to_static

        # ソースファイル作成
        source = tmp_path / "source.png"
        source.write_bytes(b"PNG_DATA")

        # コピー先ディレクトリ
        static_dir = tmp_path / "static" / "images"

        # コピー実行
        dest_path = copy_image_to_static(
            source_path=source,
            static_dir=static_dir,
            filename="copied_image.png",
        )

        assert dest_path.exists()
        assert dest_path.read_bytes() == b"PNG_DATA"
        assert dest_path.name == "copied_image.png"

    def test_copy_creates_directory(self, tmp_path):
        """ディレクトリが存在しない場合は作成すること"""
        from scripts.update_question_images import copy_image_to_static

        source = tmp_path / "source.png"
        source.write_bytes(b"PNG_DATA")

        static_dir = tmp_path / "nonexistent" / "static" / "images"
        assert not static_dir.exists()

        dest_path = copy_image_to_static(
            source_path=source,
            static_dir=static_dir,
            filename="image.png",
        )

        assert static_dir.exists()
        assert dest_path.exists()


class TestCreateQuestionImage:
    """QuestionImageレコード作成のテスト"""

    @pytest.mark.asyncio
    async def test_create_question_image(self):
        """QuestionImageレコードを作成できること"""
        from scripts.update_question_images import create_question_image

        # モックセッション
        mock_session = AsyncMock()
        question_id = uuid.uuid4()

        result = await create_question_image(
            session=mock_session,
            question_id=question_id,
            file_path="images/test.png",
            alt_text="テスト画像",
            position=0,
            image_type="figure",
        )

        # addが呼ばれたことを確認
        mock_session.add.assert_called_once()
        added_obj = mock_session.add.call_args[0][0]
        assert added_obj.question_id == question_id
        assert added_obj.file_path == "images/test.png"
        assert added_obj.alt_text == "テスト画像"
        assert added_obj.position == 0


class TestUpdateWithDbSession:
    """DB更新統合テスト"""

    @pytest.mark.asyncio
    async def test_update_with_db_session(self, tmp_path):
        """DBセッション経由で更新が行われること"""
        from scripts.update_question_images import update_question_images

        # マッチングファイルを作成
        question_id = str(uuid.uuid4())
        matches_path = tmp_path / "matches.json"
        matches_data = [
            {
                "question_id": question_id,
                "image_xref": 100,
                "image_page": 0,
                "caption": "テスト画像",
            },
        ]
        with open(matches_path, "w", encoding="utf-8") as f:
            json.dump(matches_data, f)

        # 画像ディレクトリを作成
        images_dir = tmp_path / "images"
        images_dir.mkdir()
        (images_dir / "page0_xref100.png").write_bytes(b"fake image")

        static_dir = tmp_path / "static" / "images"

        # モックセッションを作成
        mock_session = AsyncMock()

        with patch(
            "scripts.update_question_images.get_async_session"
        ) as mock_get_session:
            # async context manager をモック
            mock_get_session.return_value.__aenter__ = AsyncMock(
                return_value=mock_session
            )
            mock_get_session.return_value.__aexit__ = AsyncMock(return_value=None)

            summary = await update_question_images(
                matches_path=str(matches_path),
                images_dir=str(images_dir),
                static_dir=str(static_dir),
                dry_run=False,
            )

        # 1件の画像が処理されること
        assert summary["images_found"] == 1
        assert summary["updated"] == 1
        # 画像ファイルがコピーされていること
        assert static_dir.exists()
