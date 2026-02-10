FROM python:3.11-slim

WORKDIR /app

# 依存関係のインストール
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# アプリケーションコードのコピー
COPY . .

# ポート設定（環境変数で上書き可能）
ENV PORT=8080
EXPOSE 8080

# 起動スクリプトをコピー
COPY start.sh .
RUN chmod +x start.sh

# 起動コマンド（マイグレーション実行後にサーバー起動）
CMD ["./start.sh"]
