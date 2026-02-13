"""プロンプトの画像取り扱い指示テスト

EXTRACTION_PROMPTに画像→テキスト変換指示が含まれていることをテスト。
"""
import pytest

from app.services.pdf_extractor import EXTRACTION_PROMPT


class TestPromptImageConversion:
    """プロンプトの画像取り扱い指示"""

    def test_prompt_has_image_handling_section(self):
        """プロンプトに画像の取り扱いセクションが存在する"""
        assert "画像の取り扱い" in EXTRACTION_PROMPT

    def test_prompt_instructs_math_image_to_latex(self):
        """数式画像→LaTeX変換の指示がある"""
        assert "LaTeX" in EXTRACTION_PROMPT or "latex" in EXTRACTION_PROMPT.lower()
        assert "数式" in EXTRACTION_PROMPT

    def test_prompt_instructs_text_image_to_text(self):
        """テキスト画像→文字変換の指示がある"""
        assert "テキストのみの画像" in EXTRACTION_PROMPT or "テキスト画像" in EXTRACTION_PROMPT

    def test_prompt_instructs_diagram_in_image_refs(self):
        """図表・グラフはimage_refsに含める指示がある"""
        assert "図表" in EXTRACTION_PROMPT or "グラフ" in EXTRACTION_PROMPT
        assert "image_refs" in EXTRACTION_PROMPT

    def test_prompt_has_format_placeholder(self):
        """テキスト挿入用のプレースホルダが存在する"""
        assert "{text}" in EXTRACTION_PROMPT
