import { describe, it, expect } from 'vitest';
import {
  computeTprFpr,
  computeRocCurve,
  computeAuc,
  computePrCurve,
  computeAp,
} from '@/lib/visual-explanations/roc-pr-curves';

describe('computeTprFpr', () => {
  it('閾値 -∞ → TPR=1, FPR=1 (全て陽性と予測)', () => {
    const { tpr, fpr } = computeTprFpr(-Infinity, 1.0);
    expect(tpr).toBeCloseTo(1, 3);
    expect(fpr).toBeCloseTo(1, 3);
  });

  it('閾値 +∞ → TPR=0, FPR=0 (全て陰性と予測)', () => {
    const { tpr, fpr } = computeTprFpr(Infinity, 1.0);
    expect(tpr).toBeCloseTo(0, 3);
    expect(fpr).toBeCloseTo(0, 3);
  });

  it('d\'=0 (ランダム) → TPR ≈ FPR', () => {
    const { tpr, fpr } = computeTprFpr(0, 0);
    expect(tpr).toBeCloseTo(fpr, 2);
  });

  it('d\'が大きいほど同じ閾値でTPRが高くFPRが低い', () => {
    const low = computeTprFpr(0.5, 1.0);
    const high = computeTprFpr(0.5, 3.0);
    expect(high.tpr).toBeGreaterThan(low.tpr);
    expect(high.fpr).toBeLessThanOrEqual(low.fpr);
  });

  it('TPR と FPR は 0~1 の範囲', () => {
    const thresholds = [-3, -1, 0, 1, 3];
    for (const t of thresholds) {
      const { tpr, fpr } = computeTprFpr(t, 2.0);
      expect(tpr).toBeGreaterThanOrEqual(0);
      expect(tpr).toBeLessThanOrEqual(1);
      expect(fpr).toBeGreaterThanOrEqual(0);
      expect(fpr).toBeLessThanOrEqual(1);
    }
  });
});

describe('computeRocCurve', () => {
  it('始点 (FPR=0, TPR=0) と終点 (FPR=1, TPR=1) を含む', () => {
    const curve = computeRocCurve(2.0);
    const first = curve[0];
    const last = curve[curve.length - 1];
    expect(first.fpr).toBeCloseTo(0, 1);
    expect(first.tpr).toBeCloseTo(0, 1);
    expect(last.fpr).toBeCloseTo(1, 1);
    expect(last.tpr).toBeCloseTo(1, 1);
  });

  it('TPR は FPR の増加に伴い単調増加', () => {
    const curve = computeRocCurve(2.0);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].tpr).toBeGreaterThanOrEqual(curve[i - 1].tpr - 0.001);
    }
  });

  it('100個以上の点を返す', () => {
    const curve = computeRocCurve(2.0);
    expect(curve.length).toBeGreaterThanOrEqual(100);
  });

  it('d\'=0 のROC曲線は対角線に近い', () => {
    const curve = computeRocCurve(0);
    for (const point of curve) {
      expect(Math.abs(point.tpr - point.fpr)).toBeLessThan(0.05);
    }
  });
});

describe('computeAuc', () => {
  it('ランダム分類器 (d\'=0) → AUC ≈ 0.5', () => {
    const auc = computeAuc(0);
    expect(auc).toBeCloseTo(0.5, 1);
  });

  it('優秀な分類器 (d\'=3) → AUC > 0.95', () => {
    const auc = computeAuc(3);
    expect(auc).toBeGreaterThan(0.95);
  });

  it('d\'が大きいほどAUCが大きい', () => {
    const auc1 = computeAuc(1);
    const auc2 = computeAuc(2);
    const auc3 = computeAuc(3);
    expect(auc2).toBeGreaterThan(auc1);
    expect(auc3).toBeGreaterThan(auc2);
  });

  it('AUC は 0~1 の範囲', () => {
    for (const d of [0, 0.5, 1, 2, 3, 4]) {
      const auc = computeAuc(d);
      expect(auc).toBeGreaterThanOrEqual(0);
      expect(auc).toBeLessThanOrEqual(1);
    }
  });
});

describe('computePrCurve', () => {
  it('点を100個以上返す', () => {
    const curve = computePrCurve(2.0, 0.5);
    expect(curve.length).toBeGreaterThanOrEqual(50);
  });

  it('recall は 0~1 の範囲', () => {
    const curve = computePrCurve(2.0, 0.5);
    for (const point of curve) {
      expect(point.recall).toBeGreaterThanOrEqual(0);
      expect(point.recall).toBeLessThanOrEqual(1.001);
    }
  });

  it('precision は 0~1 の範囲', () => {
    const curve = computePrCurve(2.0, 0.5);
    for (const point of curve) {
      expect(point.precision).toBeGreaterThanOrEqual(0);
      expect(point.precision).toBeLessThanOrEqual(1.001);
    }
  });

  it('陽性割合が低いとprecisionが下がりやすい', () => {
    const apBalanced = computeAp(2.0, 0.5);
    const apImbalanced = computeAp(2.0, 0.1);
    expect(apBalanced).toBeGreaterThan(apImbalanced);
  });
});

describe('computeAp', () => {
  it('AP は 0~1 の範囲', () => {
    const ap = computeAp(2.0, 0.5);
    expect(ap).toBeGreaterThanOrEqual(0);
    expect(ap).toBeLessThanOrEqual(1);
  });

  it('d\'が大きいほどAPが大きい', () => {
    const ap1 = computeAp(1, 0.5);
    const ap2 = computeAp(2, 0.5);
    const ap3 = computeAp(3, 0.5);
    expect(ap2).toBeGreaterThan(ap1);
    expect(ap3).toBeGreaterThan(ap2);
  });

  it('d\'=0 のAP ≈ 陽性割合 (ランダム分類器)', () => {
    const positiveRate = 0.5;
    const ap = computeAp(0, positiveRate);
    expect(ap).toBeCloseTo(positiveRate, 1);
  });
});
