"""模試AI分析サービス

Claude CLIを使用して模試結果の詳細分析を生成する
"""
import asyncio
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


async def call_claude_cli(prompt: str) -> str:
    """Claude Code CLIをsubprocessで呼び出してレスポンスを取得"""
    process = await asyncio.create_subprocess_exec(
        "claude", "-p", prompt,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await process.communicate()
    stdout_text = stdout.decode()
    stderr_text = stderr.decode()

    if process.returncode != 0:
        raise Exception(f"Claude CLI failed: {stderr_text}")

    return stdout_text.strip()


async def generate_ai_analysis(
    score: float,
    correct_count: int,
    total: int,
    passed: bool,
    category_scores: dict[str, dict[str, Any]],
) -> Optional[str]:
    """Claude CLIを使用してAI分析を生成

    Args:
        score: 正答率
        correct_count: 正答数
        total: 総問題数
        passed: 合否
        category_scores: カテゴリ別スコア

    Returns:
        Markdown形式のAI分析、失敗時はNone
    """
    # カテゴリ別スコアのテキスト化
    category_text = ""
    for area, detail in category_scores.items():
        category_text += (
            f"- {area}: {detail.get('accuracy', 0)}% "
            f"({detail.get('correct', 0)}/{detail.get('total', 0)}) "
            f"グレード{detail.get('grade', 'F')}\n"
        )

    pass_status = "合格" if passed else "不合格"

    prompt = f"""あなたはE資格試験の厳格な採点官です。以下の模擬試験結果について、辛口かつ建設的なフィードバックをMarkdown形式で提供してください。

## 試験結果
- スコア: {score}% ({correct_count}/{total}問正解)
- 判定: {pass_status}

## カテゴリ別成績
{category_text}

以下の観点で分析してください:
1. **総合評価**: 率直な実力判定（甘い言葉は不要）
2. **弱点分析**: 特にスコアの低い分野の具体的な問題点
3. **学習優先度**: どの分野をどの順番で強化すべきか
4. **具体的アドバイス**: 各弱点分野の効果的な学習方法
5. **本番への提言**: 本番試験に向けた注意点

厳しく、しかし的確に。受験者の成長のために遠慮は不要です。"""

    try:
        return await call_claude_cli(prompt)
    except Exception as e:
        logger.error(f"AI分析の生成に失敗: {e}")
        return None
