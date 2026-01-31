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

# 起動コマンド
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
