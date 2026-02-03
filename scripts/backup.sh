#!/bin/bash
# データベースバックアップスクリプト
# 使用方法: ./scripts/backup.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backend/data"
CONTAINER_NAME="e-cert-study-db"
DB_USER="user"
DB_NAME="e_cert_study"

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# バックアップディレクトリ確認
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ バックアップディレクトリが存在しません: $BACKUP_DIR"
    exit 1
fi

# コンテナ稼働確認
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ DBコンテナが稼働していません: $CONTAINER_NAME"
    exit 1
fi

# バックアップ実行
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
echo "📦 バックアップ作成中..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# 結果確認
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ バックアップ完了: $BACKUP_FILE ($SIZE)"
else
    echo "❌ バックアップ失敗"
    exit 1
fi
