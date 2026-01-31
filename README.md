# E資格学習アプリ

PDFの参考書/問題集からAIで問題を抽出し、Web上で問題演習・傾向分析を行うE資格学習アプリ

## 技術スタック

- **フロントエンド**: Next.js 16 + TypeScript + Tailwind CSS
- **バックエンド**: FastAPI (Python 3.11+)
- **データベース**: PostgreSQL 16
- **PDF解析**: Gemini API
- **進捗管理**: localStorage（認証なし）

## プロジェクト構成

```
e-cert-study/
├── frontend/          # Next.js アプリ
│   ├── src/
│   │   ├── app/       # App Router (ホーム、問題演習、復習、分析、インポート)
│   │   ├── components/ # UIコンポーネント
│   │   ├── hooks/     # カスタムフック
│   │   ├── lib/       # APIクライアント
│   │   └── types/     # 型定義
│   └── ...
├── backend/           # FastAPI サーバー
│   ├── app/
│   │   ├── api/       # エンドポイント (questions, answers, categories, stats)
│   │   ├── core/      # 設定
│   │   ├── models/    # SQLAlchemy モデル
│   │   ├── schemas/   # Pydantic スキーマ
│   │   └── services/  # ビジネスロジック (PDF抽出)
│   ├── alembic/       # マイグレーション
│   └── tests/         # テスト (41件)
└── docker-compose.yml
```

## セットアップ

### 1. PostgreSQLの起動

```bash
docker-compose up -d db
```

### 2. バックエンドのセットアップ

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# マイグレーション実行
alembic upgrade head

# サーバー起動
uvicorn app.main:app --reload
```

### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install
npm run dev
```

## 環境変数

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/e_cert_study
GOOGLE_API_KEY=your_gemini_api_key
DEBUG=true
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## テスト実行

### バックエンド

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v  # 41件のテスト、カバレッジ82%
```

### フロントエンド

```bash
cd frontend
npm run test:run  # 25件のテスト
```

## API エンドポイント

### 問題管理
- `GET /api/questions` - 問題一覧
- `GET /api/questions/{id}` - 問題詳細
- `GET /api/questions/random` - ランダム出題
- `GET /api/questions/smart?user_id={id}` - 苦手分野優先のスマート出題
- `POST /api/questions` - 問題作成
- `POST /api/questions/import` - PDFから問題抽出

### 回答・学習
- `POST /api/answers` - 回答送信
- `GET /api/answers/history` - 回答履歴

### カテゴリ
- `GET /api/categories` - カテゴリ一覧
- `POST /api/categories` - カテゴリ作成

### 統計・分析
- `GET /api/stats/overview` - 学習概要統計
- `GET /api/stats/weak-areas` - 苦手分野分析
- `GET /api/stats/progress` - 日別進捗

## 画面構成

1. **ホーム** (`/`) - 学習進捗サマリー、各機能へのナビゲーション
2. **問題演習** (`/practice`) - ランダム出題、回答・解説表示
3. **復習モード** (`/review`) - 間違えた問題を重点的に復習
4. **分析ダッシュボード** (`/stats`) - 正解率、苦手分野、日別進捗グラフ
5. **問題インポート** (`/import`) - PDF取り込み、AI問題抽出

## 実装済み機能

### Phase 1-2: 基盤構築・問題管理 ✅
- [x] プロジェクト初期化 (Next.js + FastAPI + PostgreSQL)
- [x] データベースモデル・マイグレーション
- [x] 問題CRUD API
- [x] 回答API
- [x] PDF問題抽出サービス（Gemini API）

### Phase 3: 学習機能 ✅
- [x] 問題表示コンポーネント（QuestionCard）
- [x] 回答・正誤判定機能
- [x] ローカル進捗管理（localStorage）
- [x] 復習モード

### Phase 4: 傾向分析 ✅
- [x] 統計API（概要、苦手分野、日別進捗）
- [x] 分析ダッシュボード
- [x] 合格水準との比較表示
- [x] PDFインポートUI

### Phase 5: 学習最適化
- [x] 苦手分野優先の出題アルゴリズム（スマート出題API）
- [ ] 学習レポート機能
- [ ] カテゴリ管理UI

## デプロイ

### アーキテクチャ

```
ユーザー → Vercel (Next.js) → Fly.io (FastAPI) → Supabase (PostgreSQL)
              ↓
         Supabase Auth (パスワード認証)
```

### 1. Supabase セットアップ

1. [Supabase](https://supabase.com)でプロジェクト作成
2. Storage にバケット `question-images` を作成（公開設定）
3. Authentication でメール/パスワード認証を有効化

### 2. データベース移行

```bash
# 環境変数設定
export SUPABASE_DB_URL="postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"
export LOCAL_DB_URL="postgresql://user:pass@localhost:5432/e_cert_study"

# 移行実行
./scripts/migrate-to-supabase.sh
```

### 3. 画像移行

```bash
export SUPABASE_URL="https://PROJECT_ID.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGc..."

python scripts/migrate-images-to-supabase.py
```

### 4. バックエンド（Fly.io）

```bash
cd backend

# Fly.io にデプロイ
fly launch
fly secrets set DATABASE_URL="postgresql+asyncpg://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"
fly secrets set SUPABASE_URL="https://PROJECT_ID.supabase.co"
fly secrets set SUPABASE_SERVICE_KEY="eyJhbGc..."
fly deploy
```

### 5. フロントエンド（Vercel）

1. [Vercel](https://vercel.com)でGitHubリポジトリをインポート
2. 環境変数を設定:
   - `NEXT_PUBLIC_API_URL`: `https://e-cert-study-api.fly.dev`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://PROJECT_ID.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGc...`

### 月額コスト: $0（全て無料枠内）

## 開発ルール

- TDD（テスト駆動開発）を厳守
- テストカバレッジ80%以上を維持
- 日本語コミットメッセージを使用

## ライセンス

MIT
