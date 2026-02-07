# e-cert-study プロジェクト

E資格学習支援アプリケーション

## プロジェクト構成

```
e-cert-study/
├── backend/      # FastAPI バックエンド (Python)
├── frontend/     # Next.js フロントエンド
└── docker-compose.yml
```

## よく使うコマンド

### バックエンド

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v --no-cov  # テスト実行
uvicorn app.main:app --reload  # 開発サーバー起動
```

### フロントエンド

```bash
cd frontend
npm run dev  # 開発サーバー起動
npm test     # テスト実行
```

## 重要なファイル

- `backend/app/services/pdf_extractor.py` - PDF問題抽出サービス
- `backend/app/services/explanation_generator.py` - 解説再生成サービス
- `backend/tests/test_pdf_service.py` - PDF抽出のテスト
