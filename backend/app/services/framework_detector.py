"""フレームワーク検出サービス

問題文と選択肢からPyTorch/TensorFlowのフレームワーク依存を検出する。
"""

# PyTorchキーワード（小文字で管理）
# 日本語テキスト内でも検出できるよう、単純な文字列マッチを使用
PYTORCH_KEYWORDS: list[str] = [
    "torch",
    "pytorch",
    ".cuda()",
    "nn.module",
    "nn.linear",
    "nn.conv2d",
    "optim.",
    "dataloader",
    "requires_grad",
    ".backward()",
    ".zero_grad()",
    "torchvision",
]

# TensorFlowキーワード（小文字で管理）
TENSORFLOW_KEYWORDS: list[str] = [
    "tensorflow",
    "tf.",
    "keras",
    "model.compile",
    "model.fit",
    "gradienttape",
    "tf.constant",
    "tf.variable",
]


def detect_framework(content: str, choices: list[str]) -> str | None:
    """問題文と選択肢からフレームワークを検出

    Args:
        content: 問題文
        choices: 選択肢リスト

    Returns:
        "pytorch", "tensorflow", または None（非依存/両方含む場合）
    """
    # 問題文と選択肢を結合して検索対象とする
    text = content + " " + " ".join(choices)
    text_lower = text.lower()

    has_pytorch = any(kw in text_lower for kw in PYTORCH_KEYWORDS)
    has_tensorflow = any(kw in text_lower for kw in TENSORFLOW_KEYWORDS)

    if has_pytorch and not has_tensorflow:
        return "pytorch"
    if has_tensorflow and not has_pytorch:
        return "tensorflow"
    # 両方含む or どちらもなし → フレームワーク非依存
    return None
