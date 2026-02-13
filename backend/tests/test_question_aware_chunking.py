"""問題構造を考慮したチャンク分割テスト

split_text_into_chunks()が問題境界を優先して分割することをテスト。
"""
import pytest

from app.services.pdf_extractor import split_text_into_chunks


class TestQuestionAwareChunking:
    """問題境界を考慮したチャンク分割"""

    def test_short_text_no_split(self):
        """短いテキストは分割されない"""
        text = "問題1 これはテストです。"
        result = split_text_into_chunks(text, max_length=1000)
        assert len(result) == 1
        assert result[0] == text

    def test_split_at_question_boundary(self):
        """問題境界で分割される"""
        q1 = "問1 これは最初の問題です。" + "あ" * 100
        q2 = "問2 これは2番目の問題です。" + "い" * 100
        text = q1 + "\n" + q2
        # max_lengthをq1より少し大きく設定して、問題境界で分割させる
        result = split_text_into_chunks(text, max_length=len(q1) + 20)
        assert len(result) == 2
        assert "問1" in result[0]
        assert "問2" in result[1]

    def test_split_at_mondai_boundary(self):
        """「問題 N」パターンで分割される"""
        q1 = "問題 1 最初の問題の内容。" + "あ" * 100
        q2 = "問題 2 次の問題の内容。" + "い" * 100
        text = q1 + "\n" + q2
        result = split_text_into_chunks(text, max_length=len(q1) + 20)
        assert len(result) == 2
        assert "問題 1" in result[0]
        assert "問題 2" in result[1]

    def test_split_at_kakko_mon_boundary(self):
        """【問N】パターンで分割される"""
        q1 = "【問1】最初の問題です。" + "あ" * 100
        q2 = "【問2】次の問題です。" + "い" * 100
        text = q1 + "\n" + q2
        result = split_text_into_chunks(text, max_length=len(q1) + 20)
        assert len(result) == 2
        assert "【問1】" in result[0]
        assert "【問2】" in result[1]

    def test_split_at_dai_n_mon_boundary(self):
        """「第N問」パターンで分割される"""
        q1 = "第1問 最初の問題です。" + "あ" * 100
        q2 = "第2問 次の問題です。" + "い" * 100
        text = q1 + "\n" + q2
        result = split_text_into_chunks(text, max_length=len(q1) + 20)
        assert len(result) == 2
        assert "第1問" in result[0]
        assert "第2問" in result[1]

    def test_subquestion_not_split(self):
        """小問パターン（(1), (2)）では分割しない"""
        body = "問1 以下の小問に答えよ。\n"
        sub1 = "(1) 小問1の内容。" + "あ" * 50 + "\n"
        sub2 = "(2) 小問2の内容。" + "い" * 50 + "\n"
        sub3 = "(3) 小問3の内容。" + "う" * 50
        text = body + sub1 + sub2 + sub3
        # テキスト全体がmax_length以下なら分割されない
        result = split_text_into_chunks(text, max_length=len(text) + 100)
        assert len(result) == 1

    def test_question_boundary_priority_over_paragraph(self):
        """問題境界は段落境界より優先される"""
        # 段落境界（空行）と問題境界の両方がある場合
        part1 = "前半の段落。\n\nここは空行で区切られた段落。" + "あ" * 80
        part2 = "\n問2 ここから新しい問題。" + "い" * 80
        text = part1 + part2
        result = split_text_into_chunks(text, max_length=len(part1) + 10)
        assert len(result) >= 2
        # 問題境界で分割されていること
        assert "問2" in result[-1]

    def test_fallback_to_paragraph_boundary(self):
        """問題境界がない場合は段落境界で分割（既存動作）"""
        para1 = "最初の段落。" + "あ" * 100
        para2 = "次の段落。" + "い" * 100
        text = para1 + "\n\n" + para2
        result = split_text_into_chunks(text, max_length=len(para1) + 10)
        assert len(result) == 2

    def test_fallback_to_sentence_boundary(self):
        """段落境界もない場合は文境界で分割（既存動作）"""
        sent1 = "あ" * 100 + "。"
        sent2 = "い" * 100 + "。"
        text = sent1 + sent2
        result = split_text_into_chunks(text, max_length=len(sent1) + 10)
        assert len(result) == 2
