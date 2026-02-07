"""フレームワーク検出テスト"""
from app.services.framework_detector import detect_framework


class TestDetectFramework:
    """detect_framework関数のテスト"""

    def test_detect_pytorch_from_torch_import(self) -> None:
        """import torchを含む問題はpytorchと判定"""
        content = "以下のコードの出力を答えよ。\nimport torch\nx = torch.tensor([1, 2, 3])"
        result = detect_framework(content, [])
        assert result == "pytorch"

    def test_detect_pytorch_from_nn_module(self) -> None:
        """nn.Moduleを含む問題はpytorchと判定"""
        content = "以下のクラスについて正しいものを選べ。"
        choices = [
            "nn.Moduleを継承している",
            "forward()メソッドを定義する",
            "requires_gradはFalse",
            "torch.no_grad()は不要",
        ]
        result = detect_framework(content, choices)
        assert result == "pytorch"

    def test_detect_pytorch_from_backward(self) -> None:
        """.backward()を含む問題はpytorchと判定"""
        content = "loss.backward()が呼ばれた後、勾配はどこに格納されるか。"
        result = detect_framework(content, [])
        assert result == "pytorch"

    def test_detect_pytorch_from_dataloader(self) -> None:
        """DataLoaderを含む問題はpytorchと判定"""
        content = "DataLoaderのバッチサイズを32に設定した場合、何回のイテレーションが必要か。"
        result = detect_framework(content, [])
        assert result == "pytorch"

    def test_detect_tensorflow_from_tf_import(self) -> None:
        """import tensorflowを含む問題はtensorflowと判定"""
        content = "以下のコードの出力を答えよ。\nimport tensorflow as tf\nx = tf.constant([1, 2, 3])"
        result = detect_framework(content, [])
        assert result == "tensorflow"

    def test_detect_tensorflow_from_keras(self) -> None:
        """kerasを含む問題はtensorflowと判定"""
        content = "model.compile()とmodel.fit()を使ってモデルを訓練する手順を選べ。"
        choices = [
            "keras.Sequentialでモデル作成",
            "tf.keras.layers.Denseを使う",
            "model.compile(optimizer='adam')",
            "model.fit(x_train, y_train)",
        ]
        result = detect_framework(content, choices)
        assert result == "tensorflow"

    def test_detect_tensorflow_from_gradient_tape(self) -> None:
        """GradientTapeを含む問題はtensorflowと判定"""
        content = "tf.GradientTapeを使って勾配を計算するコードの空欄を埋めよ。"
        result = detect_framework(content, [])
        assert result == "tensorflow"

    def test_detect_none_for_theory_question(self) -> None:
        """理論問題はNoneと判定"""
        content = "バッチ正規化（Batch Normalization）の効果として正しいものを選べ。"
        choices = [
            "内部共変量シフトを軽減する",
            "学習率を大きくできる",
            "正則化効果がある",
            "すべて正しい",
        ]
        result = detect_framework(content, choices)
        assert result is None

    def test_detect_none_for_math_question(self) -> None:
        """数学問題はNoneと判定"""
        content = "以下の行列の固有値を求めよ。A = [[2, 1], [1, 2]]"
        result = detect_framework(content, [])
        assert result is None

    def test_detect_none_for_both_frameworks(self) -> None:
        """両方のフレームワークを含む場合はNoneと判定"""
        content = "PyTorchとTensorFlowの違いについて正しいものを選べ。"
        choices = [
            "PyTorchはtorch.tensorを使う",
            "TensorFlowはtf.constantを使う",
            "両方とも自動微分をサポートする",
            "実行速度に差はない",
        ]
        result = detect_framework(content, choices)
        assert result is None

    def test_detect_from_choices_only(self) -> None:
        """問題文にはなく選択肢からフレームワークを検出"""
        content = "以下のコードの出力を答えよ。"
        choices = [
            "optim.SGD(model.parameters(), lr=0.01)",
            "optim.Adam(model.parameters())",
            "optim.RMSprop(model.parameters())",
            "上記すべて正しい",
        ]
        result = detect_framework(content, choices)
        assert result == "pytorch"

    def test_detect_pytorch_cuda(self) -> None:
        """.cuda()を含む問題はpytorchと判定"""
        content = "model.cuda()を実行した後のモデルの状態について正しいものを選べ。"
        result = detect_framework(content, [])
        assert result == "pytorch"

    def test_detect_tensorflow_variable(self) -> None:
        """tf.Variableを含む問題はtensorflowと判定"""
        content = "tf.Variableとtf.constantの違いについて正しいものを選べ。"
        result = detect_framework(content, [])
        assert result == "tensorflow"

    def test_case_insensitive_pytorch(self) -> None:
        """PyTorchの大文字小文字を区別しない"""
        content = "PyTorchフレームワークについて正しいものを選べ。"
        choices = ["動的計算グラフ", "静的計算グラフ", "両方", "どちらでもない"]
        result = detect_framework(content, choices)
        assert result == "pytorch"

    def test_torchvision_detection(self) -> None:
        """torchvisionはpytorchと判定"""
        content = "torchvision.transformsを使って画像を前処理する方法を選べ。"
        result = detect_framework(content, [])
        assert result == "pytorch"
