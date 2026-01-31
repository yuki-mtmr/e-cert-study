#!/usr/bin/env python3
"""
画像をSupabase Storageに移行するスクリプト
"""
import os
import sys
from pathlib import Path

# バックエンドディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from supabase import create_client


def main():
    """メイン処理"""
    # 環境変数チェック
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
    bucket_name = os.environ.get("SUPABASE_BUCKET_NAME", "question-images")
    local_images_dir = os.environ.get("LOCAL_IMAGES_DIR", str(backend_dir / "static" / "images"))

    if not supabase_url or not supabase_key:
        print("エラー: SUPABASE_URL と SUPABASE_SERVICE_KEY を設定してください")
        sys.exit(1)

    print(f"=== Supabase Storage 画像移行 ===")
    print(f"URL: {supabase_url}")
    print(f"バケット: {bucket_name}")
    print(f"ローカルディレクトリ: {local_images_dir}")

    # Supabaseクライアント作成
    supabase = create_client(supabase_url, supabase_key)
    storage = supabase.storage.from_(bucket_name)

    # ローカル画像ディレクトリを走査
    local_path = Path(local_images_dir)
    if not local_path.exists():
        print(f"警告: ディレクトリが存在しません: {local_images_dir}")
        return

    uploaded = 0
    failed = 0

    for question_dir in local_path.iterdir():
        if not question_dir.is_dir():
            continue

        question_id = question_dir.name
        print(f"\n処理中: {question_id}")

        for image_file in question_dir.iterdir():
            if image_file.suffix.lower() not in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
                continue

            # Supabaseにアップロード
            remote_path = f"{question_id}/{image_file.name}"

            try:
                with open(image_file, "rb") as f:
                    image_data = f.read()

                # Content-Type を判定
                suffix = image_file.suffix.lower()
                content_type = {
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".gif": "image/gif",
                    ".webp": "image/webp",
                }.get(suffix, "application/octet-stream")

                storage.upload(
                    path=remote_path,
                    file=image_data,
                    file_options={"content-type": content_type}
                )

                print(f"  ✓ {image_file.name}")
                uploaded += 1

            except Exception as e:
                print(f"  ✗ {image_file.name}: {e}")
                failed += 1

    print(f"\n=== 完了 ===")
    print(f"アップロード成功: {uploaded}")
    print(f"失敗: {failed}")


if __name__ == "__main__":
    main()
