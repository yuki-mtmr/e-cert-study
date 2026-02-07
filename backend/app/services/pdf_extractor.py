"""PDF問題抽出サービス

Claude Code CLIを使用してPDFテキストから問題を抽出する
"""
import asyncio
import hashlib
import json
import logging
import re
import uuid
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# キャッシュディレクトリ
CACHE_DIR = Path(__file__).parent.parent.parent / ".cache" / "pdf_extractions"


class PDFExtractionError(Exception):
    """PDF問題抽出エラー"""

    pass

# 問題抽出用プロンプト
EXTRACTION_PROMPT = """
以下のテキストから、E資格の試験問題として使える選択式問題を抽出してください。

テキスト:
{text}

以下の形式のJSONで出力してください（配列形式）:
[
    {{
        "content": "問題文",
        "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
        "correct_answer": 0,
        "explanation": "解説文",
        "difficulty": 3,
        "content_type": "plain",
        "image_refs": [],
        "category": "カテゴリ名"
    }}
]

フィールド説明:
- content: 問題文（コードブロックや数式を含む場合はMarkdown形式で記述）
- choices: 4つの選択肢（配列）
- correct_answer: 正解の選択肢のインデックス（0始まり）
- explanation: 解説文（以下のガイドラインに従って記述）
- difficulty: 難易度（1:易しい〜5:難しい）
- content_type: コンテンツの種類
  - "plain": 通常のテキストのみ
  - "markdown": コードブロック（```python...```）や数式（$...$、$$...$$）を含む
  - "code": 問題文全体がコードの場合
- image_refs: この問題に関連する画像ファイル名のリスト（例: ["image_001.png", "image_002.png"]）
  - テキスト中の画像参照 ![...](ファイル名) から抽出
  - 問題文や選択肢、解説に関連する画像のみを含める
  - 関連画像がない場合は空配列
- category: この問題が属するE資格カテゴリ名（以下から1つ選択: 線形代数, 確率・統計, 情報理論, 教師あり学習, 教師なし学習, 評価指標, 順伝播型ニューラルネットワーク, CNN, RNN, Transformer, 生成モデル, 強化学習, ミドルウェア, フレームワーク, 計算リソース, データ収集・加工, MLOps）
  - PDFの目次・章構造を参考にしてカテゴリを判断してください

【解説の記述ガイドライン】

解説は教育的・実用的な内容にしてください。
必ず以下の3つのMarkdownセクションヘッダーを使用して構造化してください:

### 正解を導く手順
（消去法やステップバイステップで正解にたどり着く過程を記述）

### 選択肢の比較
（各選択肢A〜Dの定義・特徴を比較し、なぜ正解/不正解かを説明）

### 覚え方のコツ
（暗記法、チェックポイント、類似概念との違いを記載）

問題タイプ別の補足:

1. **数式を含む問題の場合:**
   - 選択肢間で記号が反転・転置しているパターン（例: +と-、×と÷、転置の有無）を指摘
   - 覚え方のコツやゴロ合わせを提供（例:「勾配降下法はマイナス方向」）
   - 似た公式との違いを明確化（例: バッチ正規化 vs レイヤー正規化）

2. **概念・用語問題の場合:**
   - 各選択肢の定義と特徴を簡潔に比較
   - 正解を導く消去法の手順を示す
   - 不正解の選択肢がなぜ間違いかを説明

3. **コード問題の場合:**
   - コードの動作をステップバイステップで説明
   - 各選択肢のコードの違いを比較
   - 典型的なミスパターンを指摘

注意事項:
- 問題は必ず4択形式にしてください
- 正解は1つのみにしてください
- 解説は丁寧に記述してください
- コードを含む問題は必ずcontent_typeを"markdown"に設定し、コードブロック記法を使用してください
- 数式を含む問題は必ずcontent_typeを"markdown"に設定し、LaTeX記法（$...$）を使用してください
- テキスト中に画像参照（![...](xxx.png)形式）がある場合は、必ずimage_refsに含めてください
- テキストから抽出できる問題がない場合は空の配列を返してください
- JSONのみを出力し、それ以外のテキストは含めないでください
"""


async def call_claude_cli(prompt: str) -> str:
    """
    Claude Code CLIをsubprocessで呼び出してレスポンスを取得

    Args:
        prompt: 送信するプロンプト

    Returns:
        Claudeからのレスポンステキスト

    Raises:
        PDFExtractionError: CLI呼び出しに失敗した場合
    """
    logger.debug(f"Calling Claude CLI with prompt length: {len(prompt)} chars")

    process = await asyncio.create_subprocess_exec(
        "claude", "-p", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()

    stdout_text = stdout.decode()
    stderr_text = stderr.decode()

    if process.returncode != 0:
        logger.error(f"Claude CLI failed with return code {process.returncode}")
        logger.error(f"stdout: {stdout_text[:500] if stdout_text else '(empty)'}")
        logger.error(f"stderr: {stderr_text[:500] if stderr_text else '(empty)'}")
        raise PDFExtractionError(
            f"Claude CLI error (code={process.returncode}): {stderr_text or stdout_text or 'Unknown error'}"
        )

    if not stdout_text.strip():
        logger.error("Claude CLI returned empty response")
        raise PDFExtractionError("Claude CLI returned empty response")

    logger.debug(f"Claude CLI response length: {len(stdout_text)} chars")
    return stdout_text


def parse_llm_response(response_text: str) -> list[dict[str, Any]]:
    """
    LLMのレスポンスをパースして問題リストを取得

    Args:
        response_text: LLMからのレスポンステキスト

    Returns:
        問題データのリスト

    Raises:
        PDFExtractionError: パースに失敗した場合
    """
    if not response_text or not response_text.strip():
        logger.error("Empty response from LLM")
        raise PDFExtractionError("Empty response from LLM")

    text = response_text.strip()

    # JSON配列を抽出（```json...```ブロックまたは直接の配列）
    json_match = re.search(r"```(?:json)?\s*(\[[\s\S]*?\])\s*```", text)
    if json_match:
        text = json_match.group(1)
    else:
        # 直接のJSON配列を探す
        array_match = re.search(r"(\[[\s\S]*\])", text)
        if array_match:
            text = array_match.group(1)

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        # 診断ログ: パース失敗時のレスポンスプレビュー（最大500文字）
        logger.error(f"JSON parse failed. Response preview: {text[:500]}")
        raise PDFExtractionError(f"Invalid JSON response: {e}")

    if not isinstance(data, list):
        raise PDFExtractionError("Response is not a JSON array")

    # 必須フィールドを持つ問題のみをフィルタリング
    required_fields = {"content", "choices", "correct_answer", "explanation", "difficulty"}
    valid_questions = []

    for item in data:
        if isinstance(item, dict) and required_fields.issubset(item.keys()):
            if isinstance(item["choices"], list) and len(item["choices"]) >= 2:
                valid_questions.append(item)

    return valid_questions


# テキストの最大長（Claude CLIの制限を考慮して約20,000文字に設定）
MAX_TEXT_LENGTH = 20000


def get_text_hash(text: str) -> str:
    """テキストのハッシュを計算する"""
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def get_cache_path(text_hash: str) -> Path:
    """キャッシュファイルのパスを取得する"""
    return CACHE_DIR / f"{text_hash}.json"


def load_from_cache(text_hash: str) -> Optional[list[dict[str, Any]]]:
    """キャッシュから問題を読み込む"""
    cache_path = get_cache_path(text_hash)
    if cache_path.exists():
        try:
            with open(cache_path, encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Loaded {len(data)} questions from cache")
                return data
        except Exception as e:
            logger.warning(f"Failed to load cache: {e}")
    return None


def save_to_cache(text_hash: str, questions: list[dict[str, Any]]) -> None:
    """問題をキャッシュに保存する"""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = get_cache_path(text_hash)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(questions)} questions to cache")
    except Exception as e:
        logger.warning(f"Failed to save cache: {e}")


def split_text_into_chunks(text: str, max_length: int = MAX_TEXT_LENGTH) -> list[str]:
    """
    テキストを適切な長さのチャンクに分割する

    段落境界で分割を試み、それが難しい場合は文境界で分割する

    Args:
        text: 分割するテキスト
        max_length: チャンクの最大長

    Returns:
        テキストチャンクのリスト
    """
    if len(text) <= max_length:
        return [text]

    chunks = []
    current_pos = 0

    while current_pos < len(text):
        # チャンクの終端位置を計算
        end_pos = min(current_pos + max_length, len(text))

        if end_pos < len(text):
            # 段落境界（空行）を探す
            search_text = text[current_pos:end_pos]
            paragraph_break = search_text.rfind("\n\n")

            if paragraph_break > max_length // 2:
                end_pos = current_pos + paragraph_break + 2
            else:
                # 文境界（。や.）を探す
                sentence_break = max(
                    search_text.rfind("。"),
                    search_text.rfind(". "),
                    search_text.rfind(".\n"),
                )
                if sentence_break > max_length // 2:
                    end_pos = current_pos + sentence_break + 1

        chunk = text[current_pos:end_pos].strip()
        if chunk:
            chunks.append(chunk)

        current_pos = end_pos

    logger.info(f"Split text into {len(chunks)} chunks")
    return chunks


async def extract_questions_from_text(
    text: str,
    source: str,
    category_id: Optional[uuid.UUID] = None,
    use_cache: bool = True,
) -> list[dict[str, Any]]:
    """
    テキストから問題を抽出する

    長いテキストは自動的にチャンク分割して処理される
    同じテキストの場合はキャッシュから結果を返す

    Args:
        text: 抽出元のテキスト
        source: 出典情報
        category_id: カテゴリID（オプション）

    Returns:
        抽出された問題データのリスト

    Raises:
        PDFExtractionError: 抽出に失敗した場合
    """
    if not text or not text.strip():
        raise PDFExtractionError("Empty text provided")

    # キャッシュを確認
    text_hash = get_text_hash(text)
    if use_cache:
        cached = load_from_cache(text_hash)
        if cached is not None:
            # キャッシュからの結果にメタデータを追加
            for q in cached:
                q["source"] = source
                if category_id:
                    q["category_id"] = category_id
            return cached

    # テキストをチャンクに分割
    chunks = split_text_into_chunks(text)
    all_questions: list[dict[str, Any]] = []
    errors: list[str] = []

    for i, chunk in enumerate(chunks):
        logger.info(f"Processing chunk {i + 1}/{len(chunks)} ({len(chunk)} chars)")

        prompt = EXTRACTION_PROMPT.format(text=chunk)

        try:
            # Claude Code CLI を呼び出し
            response_text = await call_claude_cli(prompt)
            questions = parse_llm_response(response_text)

            # メタデータを追加
            for q in questions:
                q["source"] = source
                q["chunk_index"] = i + 1
                if category_id:
                    q["category_id"] = category_id

            all_questions.extend(questions)
            logger.info(f"Chunk {i + 1}: extracted {len(questions)} questions")

        except PDFExtractionError as e:
            # チャンク単位のエラーは記録して続行
            error_msg = f"Chunk {i + 1} failed: {e}"
            logger.warning(error_msg)
            errors.append(error_msg)
            continue
        except Exception as e:
            # 予期しないエラーもPDFExtractionErrorでラップ
            error_msg = f"Chunk {i + 1} unexpected error: {e}"
            logger.warning(error_msg)
            errors.append(error_msg)
            continue

    if not all_questions and errors:
        # 全チャンクが失敗した場合
        raise PDFExtractionError(f"All chunks failed: {'; '.join(errors[:3])}")

    # キャッシュに保存（メタデータなしで保存）
    if use_cache and all_questions:
        # source, category_id, chunk_indexを除いた状態で保存
        cache_questions = []
        for q in all_questions:
            cache_q = {k: v for k, v in q.items() if k not in ("source", "category_id")}
            cache_questions.append(cache_q)
        save_to_cache(text_hash, cache_questions)

    logger.info(f"Total questions extracted: {len(all_questions)}")
    return all_questions


async def extract_questions_from_text_single(
    text: str,
    source: str,
    category_id: Optional[uuid.UUID] = None,
) -> list[dict[str, Any]]:
    """
    単一のテキストから問題を抽出する（チャンク分割なし、内部用）
    """
    prompt = EXTRACTION_PROMPT.format(text=text)

    try:
        response_text = await call_claude_cli(prompt)
        questions = parse_llm_response(response_text)

        for q in questions:
            q["source"] = source
            if category_id:
                q["category_id"] = category_id

        return questions

    except PDFExtractionError:
        raise
    except Exception as e:
        raise PDFExtractionError(f"Failed to extract questions: {e}")


async def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    PDFからテキストを抽出する

    Args:
        pdf_content: PDFファイルのバイナリデータ

    Returns:
        抽出されたテキスト

    Raises:
        PDFExtractionError: PDFの読み込みに失敗した場合、
                           または全ページからテキストを抽出できなかった場合
    """
    from io import BytesIO

    from pypdf import PdfReader

    # pypdfのCMap関連警告を抑制（ノイズを減らす）
    # pypdfはloggingモジュールを使用するため、ロガーレベルを調整
    pypdf_logger = logging.getLogger("pypdf")
    original_level = pypdf_logger.level
    pypdf_logger.setLevel(logging.ERROR)

    try:
        reader = PdfReader(BytesIO(pdf_content), strict=False)
        text_parts = []
        total_pages = len(reader.pages)

        # 診断ログ: 総ページ数
        logger.info(f"Processing PDF with {total_pages} pages")

        for i in range(total_pages):
            try:
                # インデックスアクセスで個別にエラーハンドリング
                page = reader.pages[i]
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                    # 診断ログ: ページごとの抽出結果（DEBUGレベル）
                    logger.debug(f"Page {i + 1}: extracted {len(page_text)} chars")
            except Exception as e:
                # ページエラーをログに記録し、次のページへ続行
                logger.warning(f"Page {i + 1} extraction failed: {e}")
                continue

        if not text_parts:
            raise PDFExtractionError("No text could be extracted from any page")

        total_text = "\n".join(text_parts)
        # 診断ログ: 抽出結果サマリー
        logger.info(f"Extracted {len(total_text)} chars from {len(text_parts)}/{total_pages} pages")

        return total_text

    except PDFExtractionError:
        raise
    except Exception as e:
        raise PDFExtractionError(f"Failed to extract text from PDF: {e}")
    finally:
        # pypdfのロガーレベルを元に戻す
        pypdf_logger.setLevel(original_level)
