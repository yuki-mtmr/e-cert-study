import { describe, it, expect } from 'vitest';
import {
  deriveClassMetrics,
  computeMacroAverage,
  computeMicroAverage,
  getQuizQuestions,
  getDefaultMatrix,
} from '@/lib/visual-explanations/micro-macro-average';
import type { ConfusionMatrix3x3 } from '@/lib/visual-explanations/micro-macro-average';

describe('deriveClassMetrics', () => {
  // 均衡な3×3混同行列
  const balanced: ConfusionMatrix3x3 = [
    [50, 5, 5],
    [5, 50, 5],
    [5, 5, 50],
  ];

  it('3クラス分の指標を返す', () => {
    const metrics = deriveClassMetrics(balanced);
    expect(metrics).toHaveLength(3);
  });

  it('各クラスにtp, fp, fn, precision, recall, f1を含む', () => {
    const metrics = deriveClassMetrics(balanced);
    for (const m of metrics) {
      expect(m).toHaveProperty('tp');
      expect(m).toHaveProperty('fp');
      expect(m).toHaveProperty('fn');
      expect(m).toHaveProperty('precision');
      expect(m).toHaveProperty('recall');
      expect(m).toHaveProperty('f1');
    }
  });

  it('均衡データのクラス0: TP=50, FP=10, FN=10', () => {
    const metrics = deriveClassMetrics(balanced);
    expect(metrics[0].tp).toBe(50);
    expect(metrics[0].fp).toBe(10);
    expect(metrics[0].fn).toBe(10);
  });

  it('precision = TP/(TP+FP)', () => {
    const metrics = deriveClassMetrics(balanced);
    expect(metrics[0].precision).toBeCloseTo(50 / 60, 4);
  });

  it('recall = TP/(TP+FN)', () => {
    const metrics = deriveClassMetrics(balanced);
    expect(metrics[0].recall).toBeCloseTo(50 / 60, 4);
  });

  it('f1 = 2*precision*recall/(precision+recall)', () => {
    const metrics = deriveClassMetrics(balanced);
    const p = 50 / 60;
    const r = 50 / 60;
    const expectedF1 = (2 * p * r) / (p + r);
    expect(metrics[0].f1).toBeCloseTo(expectedF1, 4);
  });

  it('TP+FP=0 のときprecision=0', () => {
    const empty: ConfusionMatrix3x3 = [
      [0, 0, 0],
      [0, 50, 5],
      [0, 5, 50],
    ];
    const metrics = deriveClassMetrics(empty);
    expect(metrics[0].precision).toBe(0);
  });
});

describe('computeMacroAverage', () => {
  const balanced: ConfusionMatrix3x3 = [
    [50, 5, 5],
    [5, 50, 5],
    [5, 5, 50],
  ];

  it('マクロ平均 = 各クラス指標の平均', () => {
    const metrics = deriveClassMetrics(balanced);
    const macro = computeMacroAverage(metrics);
    const avgPrecision = metrics.reduce((s, m) => s + m.precision, 0) / 3;
    expect(macro.precision).toBeCloseTo(avgPrecision, 4);
  });

  it('均衡データではマクロ≈マイクロ', () => {
    const metrics = deriveClassMetrics(balanced);
    const macro = computeMacroAverage(metrics);
    const micro = computeMicroAverage(metrics);
    expect(macro.precision).toBeCloseTo(micro.precision, 2);
  });
});

describe('computeMicroAverage', () => {
  const balanced: ConfusionMatrix3x3 = [
    [50, 5, 5],
    [5, 50, 5],
    [5, 5, 50],
  ];

  it('マイクロ平均 = 全体TP合算 / (全体TP+FP合算)', () => {
    const metrics = deriveClassMetrics(balanced);
    const micro = computeMicroAverage(metrics);
    const totalTp = 150;
    const totalFp = 30;
    expect(micro.precision).toBeCloseTo(totalTp / (totalTp + totalFp), 4);
  });

  it('不均衡データ → マクロとマイクロに乖離', () => {
    const imbalanced: ConfusionMatrix3x3 = [
      [100, 2, 2],
      [10, 20, 5],
      [10, 5, 10],
    ];
    const metrics = deriveClassMetrics(imbalanced);
    const macro = computeMacroAverage(metrics);
    const micro = computeMicroAverage(metrics);
    expect(Math.abs(macro.precision - micro.precision)).toBeGreaterThan(0.01);
  });
});

describe('getQuizQuestions', () => {
  it('5問のクイズを返す', () => {
    const questions = getQuizQuestions();
    expect(questions).toHaveLength(5);
  });

  it('各問題に必要なプロパティがある', () => {
    const questions = getQuizQuestions();
    for (const q of questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('scenario');
      expect(q).toHaveProperty('correctAnswer');
      expect(q).toHaveProperty('explanation');
    }
  });

  it('correctAnswer は macro/micro/either のいずれか', () => {
    const questions = getQuizQuestions();
    for (const q of questions) {
      expect(['macro', 'micro', 'either']).toContain(q.correctAnswer);
    }
  });

  it('IDが全てユニーク', () => {
    const questions = getQuizQuestions();
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(5);
  });
});

describe('getDefaultMatrix', () => {
  it('3x3の行列を返す', () => {
    const matrix = getDefaultMatrix();
    expect(matrix).toHaveLength(3);
    expect(matrix[0]).toHaveLength(3);
  });

  it('不均衡データを返す（行合計が異なる）', () => {
    const matrix = getDefaultMatrix();
    const rowSums = matrix.map((row) => row.reduce((s, v) => s + v, 0));
    // 各行の合計が異なること（不均衡）
    const uniqueSums = new Set(rowSums);
    expect(uniqueSums.size).toBeGreaterThan(1);
  });

  it('不均衡データでマクロとマイクロに0.05以上の差がある', () => {
    const matrix = getDefaultMatrix();
    const metrics = deriveClassMetrics(matrix);
    const macro = computeMacroAverage(metrics);
    const micro = computeMicroAverage(metrics);
    expect(Math.abs(macro.f1 - micro.f1)).toBeGreaterThan(0.05);
  });
});

describe('deriveClassMetrics - クラス名', () => {
  it('クラス名が「犬」「猫」「鳥」である', () => {
    const matrix = getDefaultMatrix();
    const metrics = deriveClassMetrics(matrix);
    expect(metrics[0].className).toBe('犬');
    expect(metrics[1].className).toBe('猫');
    expect(metrics[2].className).toBe('鳥');
  });
});
