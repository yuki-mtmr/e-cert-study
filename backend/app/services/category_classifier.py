"""カテゴリ分類サービス

Claude CLIを使用して問題内容からカテゴリを自動分類する
"""
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# E資格カテゴリ名リスト（子カテゴリのみ - 分類対象）
E_CERT_CATEGORY_NAMES: list[str] = [
    # 応用数学
    "線形代数",
    "確率・統計",
    "情報理論",
    # 機械学習
    "教師あり学習",
    "教師なし学習",
    "評価指標",
    # 深層学習の基礎
    "順伝播型ニューラルネットワーク",
    "CNN",
    "RNN",
    # 深層学習の応用
    "Transformer",
    "生成モデル",
    "強化学習",
    # 開発・運用環境
    "ミドルウェア",
    "フレームワーク",
    "計算リソース",
    "データ収集・加工",
    "MLOps",
    # 親カテゴリ（フォールバック用）
    "応用数学",
    "機械学習",
    "深層学習の基礎",
    "深層学習の応用",
    "開発・運用環境",
]

# カテゴリ分類用プロンプト
CLASSIFICATION_PROMPT = """
以下の問題を、E資格の分野カテゴリに分類してください。

問題内容:
{content}

{choices_text}

分類先カテゴリ（この中から1つだけ選んでください）:
- 線形代数（行列、ベクトル、固有値、特異値分解など）
- 確率・統計（確率分布、ベイズ、推定、検定など）
- 情報理論（エントロピー、相互情報量、KLダイバージェンスなど）
- 教師あり学習（回帰、分類、SVM、決定木、アンサンブルなど）
- 教師なし学習（クラスタリング、次元削減、PCAなど）
- 評価指標（精度、再現率、F1、AUC、混同行列など）
- 順伝播型ニューラルネットワーク（MLP、活性化関数、勾配降下、最適化など）
- CNN（畳み込み、プーリング、画像認識など）
- RNN（LSTM、GRU、系列データ、時系列など）
- Transformer（Attention、BERT、GPTなど）
- 生成モデル（VAE、GAN、拡散モデルなど）
- 強化学習（Q学習、方策勾配、Actor-Criticなど）
- ミドルウェア（Docker、Kubernetes、コンテナ技術など）
- フレームワーク（PyTorch、TensorFlow、JAXなど）
- 計算リソース（GPU、TPU、分散学習、メモリ管理など）
- データ収集・加工（前処理、データ拡張、アノテーションなど）
- MLOps（実験管理、モデル管理、CI/CD、監視など）

カテゴリ名のみを出力してください。余計な説明は不要です。
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


class CategoryClassifier:
    """問題カテゴリ分類クラス"""

    def _extract_category_name(self, response: str) -> Optional[str]:
        """レスポンスからカテゴリ名を抽出

        括弧付きのレスポンス（例：「確率・統計（確率分布、ベイズなど）」）から
        括弧前のカテゴリ名を抽出する。

        Args:
            response: Claude CLIからのレスポンス

        Returns:
            抽出されたカテゴリ名、抽出できない場合はNone
        """
        if not response:
            return None

        # 括弧の前の部分を抽出
        # 「確率・統計（...）」→「確率・統計」
        if "（" in response:
            return response.split("（")[0].strip()
        if "(" in response:
            return response.split("(")[0].strip()

        return None

    async def classify(
        self,
        content: str,
        choices: Optional[list[str]] = None,
    ) -> Optional[str]:
        """
        問題内容からカテゴリを分類

        Args:
            content: 問題文
            choices: 選択肢リスト（オプション）

        Returns:
            カテゴリ名、分類できない場合はNone
        """
        if not content or not content.strip():
            return None

        # 選択肢テキストを構築
        choices_text = ""
        if choices:
            choices_text = "選択肢:\n" + "\n".join(
                f"- {choice}" for choice in choices
            )

        prompt = CLASSIFICATION_PROMPT.format(
            content=content,
            choices_text=choices_text,
        )

        try:
            response = await call_claude_cli(prompt)
            category_name = response.strip()

            # 有効なカテゴリ名かチェック
            if category_name in E_CERT_CATEGORY_NAMES:
                return category_name

            # 括弧付きレスポンス（例：「確率・統計（確率分布、ベイズなど）」）から
            # カテゴリ名を抽出
            extracted = self._extract_category_name(category_name)
            if extracted and extracted in E_CERT_CATEGORY_NAMES:
                return extracted

            logger.warning(
                f"Unknown category response: {category_name}"
            )
            return None

        except Exception as e:
            logger.error(f"Classification failed: {e}")
            return None


async def classify_question(
    content: str,
    choices: Optional[list[str]] = None,
) -> Optional[str]:
    """
    問題内容からカテゴリを分類する関数インターフェース

    Args:
        content: 問題文
        choices: 選択肢リスト（オプション）

    Returns:
        カテゴリ名、分類できない場合はNone
    """
    classifier = CategoryClassifier()
    return await classifier.classify(content, choices)
