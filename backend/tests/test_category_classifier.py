"""カテゴリ分類サービスのテスト"""
import pytest
from unittest.mock import patch, AsyncMock

from app.services.category_classifier import (
    CategoryClassifier,
    classify_question,
    CLASSIFICATION_PROMPT,
    E_CERT_CATEGORY_NAMES,
)


class TestCategoryClassifier:
    """CategoryClassifierクラスのテスト"""

    def test_e_cert_category_names_contains_all_categories(self) -> None:
        """E資格カテゴリ名リストに全カテゴリが含まれている"""
        expected_categories = [
            # 親カテゴリ
            "応用数学",
            "機械学習",
            "深層学習の基礎",
            "深層学習の応用",
            "開発・運用環境",
            # 子カテゴリ
            "線形代数",
            "確率・統計",
            "情報理論",
            "教師あり学習",
            "教師なし学習",
            "評価指標",
            "順伝播型ニューラルネットワーク",
            "CNN",
            "RNN",
            "Transformer",
            "生成モデル",
            "強化学習",
            "ミドルウェア",
            "フレームワーク",
            "計算リソース",
            "データ収集・加工",
            "MLOps",
        ]
        for category in expected_categories:
            assert category in E_CERT_CATEGORY_NAMES

    def test_classification_prompt_contains_categories(self) -> None:
        """分類プロンプトにカテゴリリストが含まれている"""
        assert "線形代数" in CLASSIFICATION_PROMPT
        assert "CNN" in CLASSIFICATION_PROMPT
        assert "Transformer" in CLASSIFICATION_PROMPT

    @pytest.mark.asyncio
    async def test_classify_question_returns_category_name(self) -> None:
        """問題内容から適切なカテゴリ名を返す"""
        # Claude CLIの呼び出しをモック
        mock_response = "CNN"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify(
                "畳み込みニューラルネットワークにおいて、プーリング層の役割を説明せよ。"
            )

            assert result == "CNN"

    @pytest.mark.asyncio
    async def test_classify_question_with_linear_algebra_content(self) -> None:
        """線形代数の問題を正しく分類"""
        mock_response = "線形代数"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify(
                "行列Aの固有値と固有ベクトルを求めよ。"
            )

            assert result == "線形代数"

    @pytest.mark.asyncio
    async def test_classify_question_with_transformer_content(self) -> None:
        """Transformerの問題を正しく分類"""
        mock_response = "Transformer"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify(
                "Self-Attentionメカニズムにおいて、Query、Key、Valueの役割を説明せよ。"
            )

            assert result == "Transformer"

    @pytest.mark.asyncio
    async def test_classify_question_with_unknown_response(self) -> None:
        """認識できないレスポンスの場合はNoneを返す"""
        mock_response = "不明なカテゴリ"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify(
                "これは何の問題ですか？"
            )

            assert result is None

    @pytest.mark.asyncio
    async def test_classify_question_strips_whitespace(self) -> None:
        """レスポンスの前後の空白を除去"""
        mock_response = "  CNN  \n"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify("畳み込み層の特徴を述べよ。")

            assert result == "CNN"


class TestClassifyQuestionFunction:
    """classify_question関数のテスト"""

    @pytest.mark.asyncio
    async def test_classify_question_function(self) -> None:
        """関数インターフェースで分類できる"""
        mock_response = "強化学習"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            result = await classify_question(
                "Q学習とSARSAの違いを説明せよ。"
            )

            assert result == "強化学習"

    @pytest.mark.asyncio
    async def test_classify_question_with_choices(self) -> None:
        """選択肢を含む問題を分類できる"""
        mock_response = "確率・統計"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            result = await classify_question(
                content="ベイズの定理について正しい説明はどれか？",
                choices=[
                    "事前確率と事後確率の関係を示す",
                    "確率変数の期待値を求める",
                    "標準偏差を計算する",
                    "相関係数を求める",
                ],
            )

            assert result == "確率・統計"


class TestCategoryClassifierEdgeCases:
    """エッジケースのテスト"""

    @pytest.mark.asyncio
    async def test_classify_empty_content(self) -> None:
        """空の問題内容の場合はNoneを返す"""
        classifier = CategoryClassifier()
        result = await classifier.classify("")
        assert result is None

    @pytest.mark.asyncio
    async def test_classify_very_short_content(self) -> None:
        """非常に短い問題内容でも分類を試みる"""
        mock_response = "機械学習"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify("SVM")

            assert result == "機械学習"

    @pytest.mark.asyncio
    async def test_classify_handles_cli_error(self) -> None:
        """CLIエラー時はNoneを返す"""
        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            side_effect=Exception("CLI error"),
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify("問題内容")

            assert result is None

    @pytest.mark.asyncio
    async def test_classify_extracts_category_from_parenthetical_response(self) -> None:
        """括弧付きレスポンスからカテゴリ名を抽出する"""
        # Claude CLIが「確率・統計（確率分布、ベイズ、推定、検定など）」と返す場合
        mock_response = "確率・統計（確率分布、ベイズ、推定、検定など）"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify(
                "ベイズの定理を用いて事後確率を求める問題"
            )

            assert result == "確率・統計"

    @pytest.mark.asyncio
    async def test_classify_extracts_category_from_response_with_explanation(self) -> None:
        """説明付きレスポンスからカテゴリ名を抽出する"""
        # Claude CLIが説明付きで返す場合
        mock_response = "CNN（畳み込み、プーリング、画像認識など）"

        with patch(
            "app.services.category_classifier.call_claude_cli",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            classifier = CategoryClassifier()
            result = await classifier.classify("畳み込み層の問題")

            assert result == "CNN"
