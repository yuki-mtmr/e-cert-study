"""画像マッチングサービス

問題と画像キャプションをマッチングするサービス。
sentence-transformersを使用してセマンティック類似度を計算。
"""
import logging
from collections import defaultdict
from typing import Any, Optional

logger = logging.getLogger(__name__)

# scripts.match_imagesからImageMatcherをインポート（遅延）
_matcher_instance: Optional[Any] = None


class ImageMatcherService:
    """問題と画像をマッチングするサービス

    sentence-transformersを使用してセマンティック類似度に基づいて
    問題と画像キャプションをマッチングする。
    """

    def __init__(self, model_name: Optional[str] = None):
        """
        Args:
            model_name: sentence-transformersモデル名（オプション）
        """
        self.model_name = model_name
        self._matcher: Optional[Any] = None

    def _get_matcher(self) -> Any:
        """ImageMatcherインスタンスを取得（遅延ロード）"""
        if self._matcher is None:
            from scripts.match_images import ImageMatcher

            if self.model_name:
                self._matcher = ImageMatcher.load(model_name=self.model_name)
            else:
                self._matcher = ImageMatcher.load()

        return self._matcher

    async def match(
        self,
        questions: list[dict[str, Any]],
        captions: list[dict[str, Any]],
        threshold: float = 0.3,
        top_k: int = 3,
    ) -> dict[str, list[dict[str, Any]]]:
        """問題と画像キャプションをマッチング

        Args:
            questions: 問題のリスト（各問題にはid, contentキーが必要）
            captions: キャプションのリスト（各キャプションにはxref, page, captionキーが必要）
            threshold: マッチング閾値（これ以下のスコアは除外）
            top_k: 各問題に対して最大何個の画像をマッチングするか

        Returns:
            問題IDをキー、マッチした画像のリストを値とする辞書
        """
        if not questions or not captions:
            return {}

        matcher = self._get_matcher()

        # マッチング実行
        matches = matcher.match(
            questions=questions,
            captions=captions,
            threshold=threshold,
            top_k=top_k,
        )

        # 問題IDごとにグループ化
        result: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for match in matches:
            question_id = match["question_id"]
            result[question_id].append({
                "xref": match["image_xref"],
                "page": match["image_page"],
                "score": match["score"],
                "caption": match["caption"],
            })

        return dict(result)

    async def match_from_pdf(
        self,
        questions: list[dict[str, Any]],
        pdf_data: bytes,
        threshold: float = 0.3,
        top_k: int = 3,
    ) -> dict[str, list[dict[str, Any]]]:
        """PDFから画像を抽出し、問題とマッチング

        Args:
            questions: 問題のリスト
            pdf_data: PDFバイナリデータ
            threshold: マッチング閾値
            top_k: 各問題に対する最大マッチ数

        Returns:
            問題IDをキー、マッチした画像のリストを値とする辞書
        """
        from app.services.caption_generator import CaptionGeneratorService

        # キャプション生成サービスを使用
        caption_service = CaptionGeneratorService()
        captions = await caption_service.generate_from_pdf(pdf_data)

        if not captions:
            logger.warning("No captions generated from PDF")
            return {}

        return await self.match(
            questions=questions,
            captions=captions,
            threshold=threshold,
            top_k=top_k,
        )
