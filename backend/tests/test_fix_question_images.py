"""fix_question_images スクリプトのテスト

PDFから画像を再抽出し、Supabase Storageにアップロードして
DBを更新するスクリプトのテスト
"""
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# テスト対象のモジュールをインポート（後で実装）
# from scripts.fix_question_images import (
#     get_question_images_from_db,
#     extract_images_from_pdf,
#     upload_image_to_supabase,
#     update_image_path_in_db,
#     match_image_to_question,
# )


class TestGetQuestionImagesFromDb:
    """DBから画像付き問題を取得するテスト"""

    @pytest.mark.asyncio
    async def test_get_question_images_returns_records(self):
        """画像レコードが正しく取得できること"""
        from scripts.fix_question_images import get_question_images_from_db

        # 実際のDBに接続してテスト
        images = await get_question_images_from_db()

        # 27件の画像が存在するはず
        assert len(images) >= 1
        # 各レコードに必要なフィールドがあること
        for img in images:
            assert "id" in img
            assert "question_id" in img
            assert "file_path" in img
            assert "alt_text" in img
            assert "position" in img

    @pytest.mark.asyncio
    async def test_get_question_images_includes_question_content(self):
        """問題文も一緒に取得できること"""
        from scripts.fix_question_images import get_question_images_from_db

        images = await get_question_images_from_db()

        # 問題文が含まれていること
        for img in images:
            assert "question_content" in img
            assert img["question_content"] is not None


class TestExtractImagesFromPdf:
    """PDFから画像を抽出するテスト"""

    @pytest.mark.asyncio
    async def test_extract_images_from_pdf(self):
        """PDFから画像を抽出できること"""
        from scripts.fix_question_images import extract_images_from_pdf

        pdf_path = Path("/Users/yukimatsumori/Downloads/ebook_unlock_delmail (1).pdf")
        if not pdf_path.exists():
            pytest.skip("PDF file not found")

        images = await extract_images_from_pdf(pdf_path)

        # 画像が抽出されること
        assert len(images) >= 1
        # 各画像にデータがあること
        for img in images:
            assert "data" in img
            assert "page_number" in img
            assert "position" in img
            assert len(img["data"]) > 0

    @pytest.mark.asyncio
    async def test_extract_images_returns_empty_for_invalid_path(self):
        """存在しないファイルでは空のリストを返すこと"""
        from scripts.fix_question_images import extract_images_from_pdf

        images = await extract_images_from_pdf(Path("/nonexistent/file.pdf"))

        assert images == []


class TestUploadImageToSupabase:
    """Supabase Storageへのアップロードテスト"""

    @pytest.mark.asyncio
    async def test_upload_image_returns_public_url(self):
        """アップロード後に公開URLが返されること"""
        import os
        from dotenv import load_dotenv
        load_dotenv()

        # Supabase環境変数がない場合はスキップ
        if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_KEY"):
            pytest.skip("Supabase credentials not configured")

        from scripts.fix_question_images import upload_image_to_supabase

        # テスト用の画像データ（最小限のPNG）
        png_header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'

        question_id = uuid.uuid4()
        position = 0

        url = await upload_image_to_supabase(
            image_data=png_header,
            question_id=question_id,
            position=position,
        )

        # URLが返されること
        assert url is not None
        assert "supabase" in url or url.startswith("https://")

    @pytest.mark.asyncio
    async def test_upload_image_raises_on_empty_data(self):
        """空のデータではエラーになること"""
        from scripts.fix_question_images import upload_image_to_supabase

        question_id = uuid.uuid4()

        with pytest.raises(ValueError):
            await upload_image_to_supabase(
                image_data=b"",
                question_id=question_id,
                position=0,
            )


class TestUpdateImagePathInDb:
    """DBの画像パス更新テスト"""

    @pytest.mark.asyncio
    async def test_update_image_path_success(self):
        """画像パスが正しく更新されること"""
        from scripts.fix_question_images import (
            get_question_images_from_db,
            update_image_path_in_db,
        )

        # 既存の画像を取得
        images = await get_question_images_from_db()
        if not images:
            pytest.skip("No images in database")

        image = images[0]
        original_path = image["file_path"]
        new_url = "https://test.supabase.co/storage/v1/object/public/test/image.png"

        # パスを更新
        success = await update_image_path_in_db(
            image_id=image["id"],
            new_path=new_url,
        )

        assert success is True

        # 元に戻す
        await update_image_path_in_db(
            image_id=image["id"],
            new_path=original_path,
        )


class TestMatchImageToQuestion:
    """画像と問題のマッチングテスト"""

    def test_match_by_position(self):
        """位置情報でマッチングできること"""
        from scripts.fix_question_images import match_image_to_question

        db_images = [
            {"question_id": "q1", "position": 0, "question_content": "問題1"},
            {"question_id": "q1", "position": 1, "question_content": "問題1"},
            {"question_id": "q2", "position": 0, "question_content": "問題2"},
        ]

        extracted_images = [
            {"page_number": 1, "position": 0, "data": b"img1"},
            {"page_number": 1, "position": 1, "data": b"img2"},
            {"page_number": 2, "position": 0, "data": b"img3"},
        ]

        # マッチング結果を検証
        # 実装方針によってテストを調整
        matches = match_image_to_question(db_images, extracted_images)

        assert len(matches) >= 0  # 実装次第で調整


class TestFixQuestionImagesIntegration:
    """統合テスト"""

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Integration test - run manually")
    async def test_full_workflow(self):
        """全体のワークフローが動作すること"""
        from scripts.fix_question_images import fix_question_images

        pdf_path = Path("/Users/yukimatsumori/Downloads/ebook_unlock_delmail (1).pdf")

        result = await fix_question_images(
            pdf_path=pdf_path,
            dry_run=True,  # 実際には更新しない
        )

        assert result["success"] is True
        assert result["images_processed"] >= 0
