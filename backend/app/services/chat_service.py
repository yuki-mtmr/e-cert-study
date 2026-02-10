"""チャットサービス

問題コンテキスト + 会話履歴からプロンプトを構築し、
Claude CLIをストリーミング実行する。
"""
import asyncio
import json
import logging
from collections.abc import AsyncGenerator

logger = logging.getLogger(__name__)

SYSTEM_CONTEXT_TEMPLATE = """あなたはE資格試験の学習を支援するAIチューターです。
以下の問題とその解説に基づいて、ユーザーの追加質問に丁寧に回答してください。

## 問題文
{content}

## 選択肢
{choices_text}

## 正解
{correct_answer}

## 解説
{explanation}

---

回答ルール:
- 上記の問題・解説の文脈に沿って回答する
- 数式がある場合はLaTeX記法（$...$）を使用する
- Markdown形式で簡潔に回答する
- 関連する概念の補足説明も適宜行う"""


def build_prompt(
    question_content: str,
    choices: list[str],
    correct_answer: int,
    explanation: str,
    history: list[dict],
    user_message: str,
) -> str:
    """プロンプトを構築する

    Args:
        question_content: 問題文
        choices: 選択肢リスト
        correct_answer: 正解のインデックス（0始まり）
        explanation: 解説テキスト
        history: 会話履歴 [{role, content}]
        user_message: ユーザーの新しいメッセージ

    Returns:
        構築されたプロンプト文字列
    """
    choices_text = "\n".join(
        f"{chr(65 + i)}. {choice}" for i, choice in enumerate(choices)
    )
    correct_label = f"{chr(65 + correct_answer)}. {choices[correct_answer]}"

    context = SYSTEM_CONTEXT_TEMPLATE.format(
        content=question_content,
        choices_text=choices_text,
        correct_answer=correct_label,
        explanation=explanation,
    )

    # 会話履歴を追加
    conversation = ""
    for msg in history:
        role_label = "ユーザー" if msg["role"] == "user" else "アシスタント"
        conversation += f"\n{role_label}: {msg['content']}"

    conversation += f"\nユーザー: {user_message}"

    return f"{context}\n\n## 会話履歴{conversation}\n\n上記の最新のユーザーの質問に回答してください。"


async def stream_chat_response(
    question_content: str,
    choices: list[str],
    correct_answer: int,
    explanation: str,
    history: list[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Claude CLIを呼び出し、SSE形式でチャンクをyieldする

    Args:
        question_content: 問題文
        choices: 選択肢リスト
        correct_answer: 正解のインデックス
        explanation: 解説テキスト
        history: 会話履歴
        user_message: ユーザーの新しいメッセージ

    Yields:
        SSE形式のテキストチャンク ("data: {text}\\n\\n")
    """
    prompt = build_prompt(
        question_content=question_content,
        choices=choices,
        correct_answer=correct_answer,
        explanation=explanation,
        history=history,
        user_message=user_message,
    )

    logger.debug(f"Chat prompt length: {len(prompt)} chars")

    try:
        process = await asyncio.create_subprocess_exec(
            "claude", "-p", prompt, "--output-format", "stream-json", "--verbose",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # stdoutを行単位で読み取り、JSONパースしてテキストチャンクをyield
        while True:
            line = await process.stdout.readline()
            if not line:
                break

            line_str = line.decode().strip()
            if not line_str:
                continue

            try:
                data = json.loads(line_str)
            except json.JSONDecodeError:
                continue

            # stream-json --verbose形式: assistantイベントのcontentからテキスト抽出
            if data.get("type") == "assistant" and "message" in data:
                for block in data["message"].get("content", []):
                    if block.get("type") == "text":
                        text = block.get("text", "")
                        if text:
                            # JSON encodeで改行を安全にエスケープしてSSE送信
                            yield f"data: {json.dumps(text, ensure_ascii=False)}\n\n"

        await process.wait()

        if process.returncode != 0:
            stderr_text = await process.stderr.read()
            error_msg = stderr_text.decode() if stderr_text else "不明なエラー"
            logger.error(f"Claude CLI failed: {error_msg}")
            yield f"data: [エラー] AI応答の生成に失敗しました\n\n"

    except Exception as e:
        logger.error(f"Chat streaming error: {e}")
        yield f"data: [エラー] AI応答の生成に失敗しました\n\n"
