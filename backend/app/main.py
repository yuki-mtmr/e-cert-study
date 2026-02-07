"""FastAPIアプリケーションのエントリーポイント"""
import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import questions, answers, categories, stats, study_plan, mock_exam
from app.core.config import settings

# ログ設定: appモジュール以下のログをINFOレベルで出力
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
# appモジュールのログレベルをINFOに設定
logging.getLogger("app").setLevel(logging.INFO)

app = FastAPI(
    title="E資格学習API",
    description="E資格学習アプリのバックエンドAPI",
    version="0.1.0",
)

# CORS設定
# 環境変数で追加のオリジンを指定可能
allowed_origins = settings.allowed_origins.copy()
if settings.extra_allowed_origins:
    extra = [o.strip() for o in settings.extra_allowed_origins.split(",") if o.strip()]
    allowed_origins.extend(extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(categories.router)
app.include_router(stats.router)
app.include_router(study_plan.router)
app.include_router(mock_exam.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}
