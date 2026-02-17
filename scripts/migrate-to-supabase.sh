#!/bin/bash
# Supabase への DB 移行スクリプト

set -e

# 色付きログ
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Supabase DB 移行スクリプト ===${NC}"

# 環境変数チェック
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "エラー: SUPABASE_DB_URL 環境変数を設定してください"
    echo "例: export SUPABASE_DB_URL='postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres'"
    exit 1
fi

if [ -z "$LOCAL_DB_URL" ]; then
    LOCAL_DB_URL="postgresql://user:pass@localhost:5432/e_cert_study"
    echo -e "${YELLOW}LOCAL_DB_URL が未設定のため、デフォルト値を使用: $LOCAL_DB_URL${NC}"
fi

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).dump"

# Step 1: ローカルDBをエクスポート
echo -e "${GREEN}Step 1: ローカルDBをエクスポート中...${NC}"
pg_dump -Fc "$LOCAL_DB_URL" > "$BACKUP_FILE"
echo "バックアップ完了: $BACKUP_FILE"

# Step 2: Supabaseにインポート（--clean で既存データを削除してから復元）
echo -e "${GREEN}Step 2: Supabaseへインポート中（既存データを上書き）...${NC}"
pg_restore --clean --if-exists --no-owner --no-acl -d "$SUPABASE_DB_URL" "$BACKUP_FILE" || true
echo "インポート完了"

# Step 3: データ検証
echo -e "${GREEN}Step 3: データ検証...${NC}"
TABLES="categories questions question_images answers study_plans review_items mock_exams mock_exam_answers"
for TABLE in $TABLES; do
    COUNT=$(psql "$SUPABASE_DB_URL" -t -c "SELECT count(*) FROM $TABLE;" 2>/dev/null | tr -d ' ')
    echo "  $TABLE: ${COUNT:-N/A} 件"
done

echo -e "${GREEN}=== 移行完了 ===${NC}"
echo "バックアップファイル: $BACKUP_FILE"
