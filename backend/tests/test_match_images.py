"""画像マッチングのテスト

sentence-transformersを使用した問題-画像マッチングのユニットテスト
numpy/sentence-transformersはオプショナル依存(vlm)のため、未インストール時はスキップ
"""
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

np = pytest.importorskip("numpy", reason="numpy is required for image matching tests")


class TestImageMatcher:
    """ImageMatcherクラスのテスト"""

    def test_compute_similarity_returns_scores(self):
        """類似度計算がスコアを返すこと"""
        from scripts.match_images import ImageMatcher

        # モックモデルを作成
        mock_model = MagicMock()

        matcher = ImageMatcher(model=mock_model)

        # 埋め込みをモック（2つの問題、3つの画像）
        mock_model.encode.side_effect = [
            np.array([[0.1, 0.2], [0.3, 0.4]]),  # questions
            np.array([[0.1, 0.2], [0.5, 0.6], [0.3, 0.4]]),  # captions
        ]

        questions = [
            {"id": "q1", "content": "問題1"},
            {"id": "q2", "content": "問題2"},
        ]
        captions = [
            {"xref": 100, "caption": "キャプション1"},
            {"xref": 101, "caption": "キャプション2"},
            {"xref": 102, "caption": "キャプション3"},
        ]

        # 類似度計算
        similarities = matcher.compute_similarity(questions, captions)

        # 結果の検証
        assert similarities is not None
        assert similarities.shape == (2, 3)  # 2問題 x 3画像

    def test_match_returns_matches(self):
        """マッチング結果を返すこと"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()
        matcher = ImageMatcher(model=mock_model)

        # 埋め込みをモック
        mock_model.encode.side_effect = [
            np.array([[1.0, 0.0], [0.0, 1.0]]),  # questions
            np.array([[0.9, 0.1], [0.1, 0.9]]),  # captions (similar to respective questions)
        ]

        questions = [
            {"id": "q1", "content": "問題1"},
            {"id": "q2", "content": "問題2"},
        ]
        captions = [
            {"xref": 100, "caption": "キャプション1", "page": 0},
            {"xref": 101, "caption": "キャプション2", "page": 1},
        ]

        # マッチング
        matches = matcher.match(questions, captions, threshold=0.3)

        # 結果の検証
        assert len(matches) == 2
        assert matches[0]["question_id"] == "q1"
        assert matches[1]["question_id"] == "q2"

    def test_match_with_threshold_filters_low_scores(self):
        """閾値以下のスコアはフィルタリングされること"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()
        matcher = ImageMatcher(model=mock_model)

        # 低い類似度を返す
        mock_model.encode.side_effect = [
            np.array([[1.0, 0.0]]),  # question
            np.array([[0.0, 1.0]]),  # caption (orthogonal = low similarity)
        ]

        questions = [{"id": "q1", "content": "問題1"}]
        captions = [{"xref": 100, "caption": "全く関係ない", "page": 0}]

        # 高い閾値でマッチング
        matches = matcher.match(questions, captions, threshold=0.8)

        # マッチなし
        assert len(matches) == 0


class TestLoadQuestions:
    """問題読み込みのテスト"""

    def test_load_questions_from_json(self, tmp_path):
        """JSONファイルから問題を読み込めること"""
        from scripts.match_images import load_questions_from_json

        questions_data = [
            {"id": "q1", "content": "問題1"},
            {"id": "q2", "content": "問題2"},
        ]

        json_path = tmp_path / "questions.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(questions_data, f)

        result = load_questions_from_json(str(json_path))

        assert len(result) == 2
        assert result[0]["id"] == "q1"

    def test_load_questions_handles_missing_file(self):
        """存在しないファイルでエラーが発生すること"""
        from scripts.match_images import load_questions_from_json

        with pytest.raises(FileNotFoundError):
            load_questions_from_json("/path/to/nonexistent.json")


class TestLoadCaptions:
    """キャプション読み込みのテスト"""

    def test_load_captions_from_json(self, tmp_path):
        """JSONファイルからキャプションを読み込めること"""
        from scripts.match_images import load_captions_from_json

        captions_data = [
            {"xref": 100, "caption": "キャプション1", "page": 0},
            {"xref": 101, "caption": "キャプション2", "page": 1},
        ]

        json_path = tmp_path / "captions.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(captions_data, f)

        result = load_captions_from_json(str(json_path))

        assert len(result) == 2
        assert result[0]["xref"] == 100


class TestSaveMatches:
    """マッチング結果保存のテスト"""

    def test_save_matches_to_json(self, tmp_path):
        """マッチング結果をJSONファイルに保存できること"""
        from scripts.match_images import save_matches_to_json

        matches = [
            {"question_id": "q1", "image_xref": 100, "score": 0.85},
            {"question_id": "q2", "image_xref": 101, "score": 0.72},
        ]

        output_path = tmp_path / "matches.json"
        save_matches_to_json(matches, str(output_path))

        assert output_path.exists()

        with open(output_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)

        assert len(loaded) == 2
        assert loaded[0]["score"] == 0.85


class TestMatchQuestionsToImages:
    """メイン関数のテスト"""

    @patch('scripts.match_images.ImageMatcher')
    @patch('scripts.match_images.load_questions_from_json')
    @patch('scripts.match_images.load_captions_from_json')
    def test_match_questions_to_images_orchestration(
        self,
        mock_load_captions,
        mock_load_questions,
        mock_matcher_class,
    ):
        """メイン関数が各コンポーネントを正しく連携させること"""
        from scripts.match_images import match_questions_to_images

        # モックの設定
        mock_load_questions.return_value = [
            {"id": "q1", "content": "問題1"},
        ]
        mock_load_captions.return_value = [
            {"xref": 100, "caption": "キャプション1", "page": 0},
        ]

        mock_matcher = MagicMock()
        mock_matcher.match.return_value = [
            {"question_id": "q1", "image_xref": 100, "score": 0.9},
        ]
        mock_matcher_class.return_value = mock_matcher

        # 実行
        result = match_questions_to_images(
            questions_path="/path/to/questions.json",
            captions_path="/path/to/captions.json",
            skip_model_load=True,
        )

        assert len(result) == 1
        assert result[0]["question_id"] == "q1"


class TestImageMatcherWithoutModel:
    """モデルなしでのImageMatcherテスト"""

    def test_default_model_name(self):
        """デフォルトモデル名が設定されていること"""
        from scripts.match_images import DEFAULT_MODEL_NAME

        assert "sentence" in DEFAULT_MODEL_NAME.lower() or "multilingual" in DEFAULT_MODEL_NAME.lower()

    def test_can_create_matcher_with_mock(self):
        """モックでImageMatcherを作成できること"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()

        matcher = ImageMatcher(model=mock_model)

        assert matcher.model is mock_model


class TestIntegrationWithRealEmbeddings:
    """実際の埋め込みを使った統合テスト（オプション）"""

    @pytest.mark.skip(reason="sentence-transformersがインストールされている場合のみ実行")
    def test_real_embedding_similarity(self):
        """実際の埋め込みで類似度が計算できること"""
        from scripts.match_images import ImageMatcher

        matcher = ImageMatcher.load()

        questions = [{"id": "q1", "content": "ニューラルネットワークの活性化関数について説明せよ"}]
        captions = [
            {"xref": 100, "caption": "ReLU関数とシグモイド関数のグラフ", "page": 0},
            {"xref": 101, "caption": "猫の写真", "page": 1},
        ]

        matches = matcher.match(questions, captions, threshold=0.3)

        # 関連性の高い画像がマッチすることを期待
        assert len(matches) >= 1
        if matches:
            assert matches[0]["image_xref"] == 100  # 活性化関数の図が選ばれるべき


class TestMatchResult:
    """MatchResultクラスのテスト"""

    def test_to_dict(self):
        """to_dictが正しい辞書を返すこと"""
        from scripts.match_images import MatchResult

        result = MatchResult(
            question_id="q1",
            image_xref=100,
            image_page=0,
            score=0.85,
            caption="テスト",
        )

        d = result.to_dict()
        assert d["question_id"] == "q1"
        assert d["image_xref"] == 100
        assert d["score"] == 0.85


class TestMatcherEmptyInput:
    """空入力のテスト"""

    def test_match_empty_questions(self):
        """問題が空の場合は空リストを返すこと"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()
        matcher = ImageMatcher(model=mock_model)

        matches = matcher.match([], [{"xref": 100, "caption": "test", "page": 0}])
        assert matches == []

    def test_match_empty_captions(self):
        """キャプションが空の場合は空リストを返すこと"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()
        matcher = ImageMatcher(model=mock_model)

        matches = matcher.match([{"id": "q1", "content": "test"}], [])
        assert matches == []


class TestMatchTopK:
    """Top-K制限のテスト"""

    def test_match_respects_top_k(self):
        """top_k制限が正しく適用されること"""
        from scripts.match_images import ImageMatcher

        mock_model = MagicMock()
        matcher = ImageMatcher(model=mock_model)

        # 全て高い類似度を返す
        mock_model.encode.side_effect = [
            np.array([[1.0, 0.0]]),  # question
            np.array([[0.9, 0.1], [0.85, 0.15], [0.8, 0.2]]),  # 3 captions
        ]

        questions = [{"id": "q1", "content": "問題1"}]
        captions = [
            {"xref": 100, "caption": "キャプション1", "page": 0},
            {"xref": 101, "caption": "キャプション2", "page": 1},
            {"xref": 102, "caption": "キャプション3", "page": 2},
        ]

        # top_k=1で最大1つだけマッチ
        matches = matcher.match(questions, captions, threshold=0.3, top_k=1)
        assert len(matches) == 1
        assert matches[0]["image_xref"] == 100  # 最高スコアのもの
