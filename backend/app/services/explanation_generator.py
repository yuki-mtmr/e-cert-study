"""解説再生成サービス

問題文・選択肢・正解から構造化された解説を生成する
"""
import asyncio
import logging

logger = logging.getLogger(__name__)

# 解説生成用プロンプト
EXPLANATION_PROMPT = """
以下のE資格試験問題について、構造化された解説をMarkdown形式で生成してください。

問題文:
{content}

選択肢:
{choices_text}

正解: {correct_answer}

以下の3つのセクションを**必ず**含めてください。各セクションは指定されたMarkdownヘッダーで始めてください:

### 正解を導く手順
- 消去法やステップバイステップで正解にたどり着く過程を説明
- まず何に着目すべきかを示し、各選択肢を順に検討
- なぜ正解の選択肢が正しいかを論理的に説明

### 選択肢の比較
- 各選択肢（A〜D）の定義・特徴を簡潔に比較
- 正解の選択肢がなぜ正しいかを明記
- 不正解の選択肢がなぜ間違いかを説明
- 選択肢間の分岐軸（何が違うのか）を明確化

### 覚え方のコツ
- 暗記法やゴロ合わせ、チェックポイントを提供
- 類似概念との違いを明確化
- 試験で使える判断基準を記載

注意事項:
- 解説のみを出力してください（JSON等は不要）
- Markdown形式で記述してください
- 数式がある場合はLaTeX記法（$...$）を使用してください
"""


async def call_claude_cli(prompt: str) -> str:
    """
    Claude Code CLIをsubprocessで呼び出してレスポンスを取得

    Args:
        prompt: 送信するプロンプト

    Returns:
        Claudeからのレスポンステキスト

    Raises:
        Exception: CLI呼び出しに失敗した場合
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
        logger.error(f"stderr: {stderr_text[:500] if stderr_text else '(empty)'}")
        raise Exception(f"Claude CLI failed: {stderr_text}")

    return stdout_text


async def generate_explanation(
    content: str,
    choices: list[str],
    correct_answer: int,
) -> str:
    """
    問題の解説を生成する

    Args:
        content: 問題文
        choices: 選択肢リスト
        correct_answer: 正解のインデックス（0始まり）

    Returns:
        Markdown形式の解説テキスト

    Raises:
        ValueError: 入力が不正な場合
        Exception: CLI呼び出しに失敗した場合
    """
    if not content or not content.strip():
        raise ValueError("問題文が空です")

    if correct_answer < 0 or correct_answer >= len(choices):
        raise ValueError(
            f"正解インデックスが範囲外です: {correct_answer} (選択肢数: {len(choices)})"
        )

    # 選択肢テキストを構築
    choices_text = "\n".join(
        f"{chr(65 + i)}. {choice}" for i, choice in enumerate(choices)
    )

    # 正解の選択肢をラベル付きで表示
    correct_label = f"{chr(65 + correct_answer)}. {choices[correct_answer]}"

    prompt = EXPLANATION_PROMPT.format(
        content=content,
        choices_text=choices_text,
        correct_answer=correct_label,
    )

    result = await call_claude_cli(prompt)
    return result.strip()
