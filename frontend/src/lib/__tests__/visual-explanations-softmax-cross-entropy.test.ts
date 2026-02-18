import { describe, it, expect } from 'vitest';
import {
  getQuestions,
  softmax1D,
  computeAxisDemo,
  crossEntropyLoss,
  computeGradient,
  PIPELINE_COLORS,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import type { QuestionId } from '@/lib/visual-explanations/softmax-cross-entropy';

describe('softmax-cross-entropy', () => {
  describe('getQuestions', () => {
    it('4つの設問メタデータを返す', () => {
      const questions = getQuestions();
      expect(questions).toHaveLength(4);
    });

    it('各設問に必要なフィールドが含まれる', () => {
      const questions = getQuestions();
      for (const q of questions) {
        expect(q.id).toBeTruthy();
        expect(q.number).toBeGreaterThanOrEqual(1);
        expect(q.number).toBeLessThanOrEqual(4);
        expect(q.title).toBeTruthy();
        expect(q.codeSnippet).toBeTruthy();
        expect(q.answer).toBeTruthy();
        expect(q.answerLatex).toBeTruthy();
        expect(q.explanation).toBeTruthy();
      }
    });

    it('IDがq1〜q4の順で並ぶ', () => {
      const questions = getQuestions();
      const ids = questions.map((q) => q.id);
      expect(ids).toEqual([
        'q1-axis-keepdims',
        'q2-ce-return',
        'q3-forward-args',
        'q4-backward-grad',
      ]);
    });

    it('numberが1〜4の連番', () => {
      const questions = getQuestions();
      const numbers = questions.map((q) => q.number);
      expect(numbers).toEqual([1, 2, 3, 4]);
    });
  });

  describe('softmax1D', () => {
    it('出力の合計が1になる', () => {
      const result = softmax1D([2.0, 1.0, 0.1]);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it('最大の入力に最大の確率を割り当てる', () => {
      const result = softmax1D([2.0, 1.0, 0.1]);
      expect(result[0]).toBeGreaterThan(result[1]);
      expect(result[1]).toBeGreaterThan(result[2]);
    });

    it('全て同じ値なら均等分布になる', () => {
      const result = softmax1D([1.0, 1.0, 1.0]);
      for (const v of result) {
        expect(v).toBeCloseTo(1 / 3);
      }
    });

    it('大きな値でもオーバーフローしない（数値安定性）', () => {
      const result = softmax1D([1000, 1001, 1002]);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
      expect(result.every((v) => isFinite(v))).toBe(true);
    });

    it('空配列に対して空配列を返す', () => {
      expect(softmax1D([])).toEqual([]);
    });
  });

  describe('computeAxisDemo', () => {
    it('デフォルト行列で結果を返す', () => {
      const result = computeAxisDemo();
      expect(result.original).toBeDefined();
      expect(result.maxAxis0).toBeDefined();
      expect(result.maxAxis1).toBeDefined();
      expect(result.keepdimsAxis1).toBeDefined();
      expect(result.subtracted).toBeDefined();
    });

    it('デフォルト行列が2x3', () => {
      const result = computeAxisDemo();
      expect(result.original).toHaveLength(2);
      expect(result.original[0]).toHaveLength(3);
    });

    it('axis=0のmaxが列方向の最大値', () => {
      const result = computeAxisDemo([[2.0, 1.0, 0.1], [1.0, 3.0, 0.2]]);
      expect(result.maxAxis0).toEqual([2.0, 3.0, 0.2]);
    });

    it('axis=1のmaxが行方向の最大値', () => {
      const result = computeAxisDemo([[2.0, 1.0, 0.1], [1.0, 3.0, 0.2]]);
      expect(result.maxAxis1).toEqual([2.0, 3.0]);
    });

    it('keepdims=Trueで形状(2,1)を保持する', () => {
      const result = computeAxisDemo([[2.0, 1.0, 0.1], [1.0, 3.0, 0.2]]);
      expect(result.keepdimsAxis1).toEqual([[2.0], [3.0]]);
    });

    it('減算結果が正しい (x - max(axis=1, keepdims=True))', () => {
      const result = computeAxisDemo([[2.0, 1.0, 0.1], [1.0, 3.0, 0.2]]);
      expect(result.subtracted[0][0]).toBeCloseTo(0.0);
      expect(result.subtracted[0][1]).toBeCloseTo(-1.0);
      expect(result.subtracted[0][2]).toBeCloseTo(-1.9);
      expect(result.subtracted[1][0]).toBeCloseTo(-2.0);
      expect(result.subtracted[1][1]).toBeCloseTo(0.0);
      expect(result.subtracted[1][2]).toBeCloseTo(-2.8);
    });
  });

  describe('crossEntropyLoss', () => {
    it('完璧な予測で損失が0に近い', () => {
      const y = [0.0, 0.0, 1.0];
      const loss = crossEntropyLoss(y, 2);
      expect(loss).toBeCloseTo(0.0, 1);
    });

    it('悪い予測で損失が大きい', () => {
      const y = [0.7, 0.2, 0.1];
      const loss = crossEntropyLoss(y, 2);
      expect(loss).toBeGreaterThan(2.0);
    });

    it('-log(y[tIndex]) の公式に従う', () => {
      const y = [0.3, 0.5, 0.2];
      const loss = crossEntropyLoss(y, 1);
      expect(loss).toBeCloseTo(-Math.log(0.5));
    });

    it('softmax出力 [0.659, 0.242, 0.099] で正解0の場合', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const loss = crossEntropyLoss(y, 0);
      expect(loss).toBeCloseTo(-Math.log(y[0]));
    });
  });

  describe('computeGradient', () => {
    it('3クラス分の勾配バーを返す', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const bars = computeGradient(y, 0);
      expect(bars).toHaveLength(3);
    });

    it('各バーに必要なフィールドが含まれる', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const bars = computeGradient(y, 0);
      for (const bar of bars) {
        expect(typeof bar.classIndex).toBe('number');
        expect(bar.label).toBeTruthy();
        expect(typeof bar.yValue).toBe('number');
        expect(typeof bar.tValue).toBe('number');
        expect(typeof bar.dxValue).toBe('number');
      }
    });

    it('正解クラスのtValueが1、他は0', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const bars = computeGradient(y, 0);
      expect(bars[0].tValue).toBe(1);
      expect(bars[1].tValue).toBe(0);
      expect(bars[2].tValue).toBe(0);
    });

    it('勾配が (y - t) / batchSize に従う', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const batchSize = 1;
      const bars = computeGradient(y, 0, batchSize);
      expect(bars[0].dxValue).toBeCloseTo((y[0] - 1) / batchSize);
      expect(bars[1].dxValue).toBeCloseTo((y[1] - 0) / batchSize);
      expect(bars[2].dxValue).toBeCloseTo((y[2] - 0) / batchSize);
    });

    it('batchSize=2のとき勾配が半分になる', () => {
      const y = softmax1D([2.0, 1.0, 0.1]);
      const bars1 = computeGradient(y, 0, 1);
      const bars2 = computeGradient(y, 0, 2);
      expect(bars2[0].dxValue).toBeCloseTo(bars1[0].dxValue / 2);
    });
  });

  describe('PIPELINE_COLORS', () => {
    it('5色が定義されている', () => {
      expect(Object.keys(PIPELINE_COLORS)).toHaveLength(5);
    });

    it('各色にhexとtailwindが含まれる', () => {
      for (const color of Object.values(PIPELINE_COLORS)) {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(color.tailwind).toBeTruthy();
      }
    });
  });

  describe('QuestionId 型', () => {
    it('有効な型として使える', () => {
      const id: QuestionId = 'q1-axis-keepdims';
      expect([
        'q1-axis-keepdims',
        'q2-ce-return',
        'q3-forward-args',
        'q4-backward-grad',
      ]).toContain(id);
    });
  });
});
