"""画像マッチングスクリプト

sentence-transformersを使用して問題と画像キャプションをマッチングする。

使用方法:
    python -m scripts.match_images --questions questions.json --captions captions.json --output matches.json

依存関係:
    pip install sentence-transformers
"""
import argparse
import json
import logging
from dataclasses import dataclass
from typing import Any, Optional

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# デフォルトモデル名
DEFAULT_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
# マッチング閾値
DEFAULT_THRESHOLD = 0.3


@dataclass
class MatchResult:
    """マッチング結果

    Attributes:
        question_id: 問題ID
        image_xref: 画像のxref
        image_page: 画像のページ番号
        score: マッチングスコア
        caption: 画像キャプション
    """
    question_id: str
    image_xref: int
    image_page: int
    score: float
    caption: str

    def to_dict(self) -> dict[str, Any]:
        """辞書に変換"""
        return {
            "question_id": self.question_id,
            "image_xref": self.image_xref,
            "image_page": self.image_page,
            "score": self.score,
            "caption": self.caption,
        }


class ImageMatcher:
    """sentence-transformersを使用した画像マッチャー

    Attributes:
        model: sentence-transformersモデル
    """

    def __init__(self, model: Any):
        """
        Args:
            model: sentence-transformersモデル
        """
        self.model = model

    @classmethod
    def load(
        cls,
        model_name: str = DEFAULT_MODEL_NAME,
    ) -> "ImageMatcher":
        """モデルをロードしてImageMatcherを作成

        Args:
            model_name: Hugging Faceモデル名

        Returns:
            ImageMatcherインスタンス
        """
        try:
            from sentence_transformers import SentenceTransformer

            logger.info(f"Loading model: {model_name}")
            model = SentenceTransformer(model_name)
            logger.info("Model loaded successfully")

            return cls(model=model)

        except ImportError as e:
            raise ImportError(
                "sentence-transformersがインストールされていません。"
                "pip install sentence-transformers"
            ) from e

    def compute_similarity(
        self,
        questions: list[dict[str, Any]],
        captions: list[dict[str, Any]],
    ) -> np.ndarray:
        """問題とキャプションの類似度を計算

        Args:
            questions: 問題のリスト（各問題にはcontentキーが必要）
            captions: キャプションのリスト（各キャプションにはcaptionキーが必要）

        Returns:
            類似度行列（questions x captions）
        """
        # テキストを抽出
        question_texts = [q["content"] for q in questions]
        caption_texts = [c["caption"] for c in captions]

        # 埋め込みを生成
        question_embeddings = self.model.encode(question_texts)
        caption_embeddings = self.model.encode(caption_texts)

        # コサイン類似度を計算
        similarities = cosine_similarity(question_embeddings, caption_embeddings)

        return similarities

    def match(
        self,
        questions: list[dict[str, Any]],
        captions: list[dict[str, Any]],
        threshold: float = DEFAULT_THRESHOLD,
        top_k: int = 3,
    ) -> list[dict[str, Any]]:
        """問題とキャプションをマッチング

        Args:
            questions: 問題のリスト
            captions: キャプションのリスト
            threshold: マッチング閾値（これ以下のスコアは除外）
            top_k: 各問題に対して最大何個の画像をマッチングするか

        Returns:
            マッチング結果のリスト
        """
        if not questions or not captions:
            return []

        # 類似度を計算
        similarities = self.compute_similarity(questions, captions)

        matches: list[dict[str, Any]] = []

        for i, question in enumerate(questions):
            question_id = question.get("id", f"q_{i}")
            scores = similarities[i]

            # スコアが高い順にソート
            sorted_indices = np.argsort(scores)[::-1]

            # 閾値以上のスコアを持つ上位top_kをマッチ
            matched_count = 0
            for j in sorted_indices:
                if matched_count >= top_k:
                    break

                score = float(scores[j])
                if score < threshold:
                    break

                caption = captions[j]
                matches.append({
                    "question_id": question_id,
                    "image_xref": caption.get("xref", j),
                    "image_page": caption.get("page", 0),
                    "score": round(score, 4),
                    "caption": caption.get("caption", ""),
                })
                matched_count += 1

        logger.info(f"Matched {len(matches)} question-image pairs")
        return matches


def load_questions_from_json(path: str) -> list[dict[str, Any]]:
    """JSONファイルから問題を読み込む

    Args:
        path: JSONファイルパス

    Returns:
        問題のリスト

    Raises:
        FileNotFoundError: ファイルが存在しない場合
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_captions_from_json(path: str) -> list[dict[str, Any]]:
    """JSONファイルからキャプションを読み込む

    Args:
        path: JSONファイルパス

    Returns:
        キャプションのリスト

    Raises:
        FileNotFoundError: ファイルが存在しない場合
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_matches_to_json(
    matches: list[dict[str, Any]],
    output_path: str,
) -> None:
    """マッチング結果をJSONファイルに保存

    Args:
        matches: マッチング結果のリスト
        output_path: 出力ファイルパス
    """
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(matches, f, ensure_ascii=False, indent=2)

    logger.info(f"Saved {len(matches)} matches to {output_path}")


def match_questions_to_images(
    questions_path: str,
    captions_path: str,
    output_path: Optional[str] = None,
    threshold: float = DEFAULT_THRESHOLD,
    top_k: int = 3,
    skip_model_load: bool = False,
) -> list[dict[str, Any]]:
    """問題と画像をマッチングするメイン関数

    Args:
        questions_path: 問題JSONファイルパス
        captions_path: キャプションJSONファイルパス
        output_path: 出力JSONファイルパス（オプション）
        threshold: マッチング閾値
        top_k: 各問題に対して最大何個の画像をマッチングするか
        skip_model_load: モデルロードをスキップ（テスト用）

    Returns:
        マッチング結果のリスト
    """
    # データ読み込み
    questions = load_questions_from_json(questions_path)
    captions = load_captions_from_json(captions_path)

    logger.info(f"Loaded {len(questions)} questions and {len(captions)} captions")

    if not questions or not captions:
        logger.warning("No questions or captions to match")
        return []

    # マッチャーを作成
    if skip_model_load:
        from unittest.mock import MagicMock
        matcher = ImageMatcher(model=MagicMock())
    else:
        matcher = ImageMatcher.load()

    # マッチング実行
    matches = matcher.match(
        questions=questions,
        captions=captions,
        threshold=threshold,
        top_k=top_k,
    )

    # 保存
    if output_path:
        save_matches_to_json(matches, output_path)

    return matches


def main():
    """メインエントリポイント"""
    parser = argparse.ArgumentParser(
        description="問題と画像キャプションをマッチング"
    )
    parser.add_argument(
        "--questions",
        required=True,
        help="問題JSONファイルパス",
    )
    parser.add_argument(
        "--captions",
        required=True,
        help="キャプションJSONファイルパス",
    )
    parser.add_argument(
        "--output",
        default="matches.json",
        help="出力JSONファイルパス",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_THRESHOLD,
        help=f"マッチング閾値（デフォルト: {DEFAULT_THRESHOLD}）",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="各問題に対して最大何個の画像をマッチングするか（デフォルト: 3）",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="詳細ログを出力",
    )

    args = parser.parse_args()

    # ロギング設定
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )

    # マッチング実行
    matches = match_questions_to_images(
        questions_path=args.questions,
        captions_path=args.captions,
        output_path=args.output,
        threshold=args.threshold,
        top_k=args.top_k,
    )

    print(f"Matched {len(matches)} question-image pairs")
    print(f"Output saved to: {args.output}")


if __name__ == "__main__":
    main()
