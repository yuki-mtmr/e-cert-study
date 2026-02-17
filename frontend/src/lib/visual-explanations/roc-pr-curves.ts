import { normalCdf } from './normal-distribution';

export interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface PrPoint {
  recall: number;
  precision: number;
  threshold: number;
}

/**
 * 2つの正規分布モデル（陰性: N(0,1), 陽性: N(d',1)）に対し、
 * 指定閾値での TPR と FPR を計算
 */
export function computeTprFpr(
  threshold: number,
  dPrime: number,
): { tpr: number; fpr: number } {
  // FPR = P(X > threshold | X ~ N(0,1)) = 1 - Φ(threshold)
  const fpr = 1 - normalCdf(threshold);
  // TPR = P(X > threshold | X ~ N(d',1)) = 1 - Φ(threshold - d')
  const tpr = 1 - normalCdf(threshold - dPrime);
  return { tpr, fpr };
}

const NUM_POINTS = 201;

/**
 * d' に基づくROC曲線を計算
 * 閾値を -6 ~ +6 で走査して (FPR, TPR) の配列を返す
 */
export function computeRocCurve(dPrime: number): RocPoint[] {
  const points: RocPoint[] = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    // 閾値を高→低に走査（FPR が 0→1 に増加するように）
    const threshold = 6 - (12 * i) / (NUM_POINTS - 1);
    const { tpr, fpr } = computeTprFpr(threshold, dPrime);
    points.push({ fpr, tpr, threshold });
  }
  return points;
}

/**
 * d' に基づくAUC（台形法）
 */
export function computeAuc(dPrime: number): number {
  const curve = computeRocCurve(dPrime);
  let auc = 0;
  for (let i = 1; i < curve.length; i++) {
    const dx = curve[i].fpr - curve[i - 1].fpr;
    const avgY = (curve[i].tpr + curve[i - 1].tpr) / 2;
    auc += dx * avgY;
  }
  return auc;
}

/**
 * d' と陽性割合に基づくPR曲線を計算
 * precision = TPR * π / (TPR * π + FPR * (1-π))
 * recall = TPR
 */
export function computePrCurve(dPrime: number, positiveRate: number): PrPoint[] {
  const points: PrPoint[] = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const threshold = 6 - (12 * i) / (NUM_POINTS - 1);
    const { tpr, fpr } = computeTprFpr(threshold, dPrime);
    const recall = tpr;
    const denom = tpr * positiveRate + fpr * (1 - positiveRate);
    const precision = denom > 0 ? (tpr * positiveRate) / denom : 1;
    if (recall > 0.001 || precision > 0.001) {
      points.push({ recall, precision, threshold });
    }
  }
  return points;
}

/**
 * Average Precision (AP) — PR曲線下の面積を台形法で近似
 */
export function computeAp(dPrime: number, positiveRate: number): number {
  const curve = computePrCurve(dPrime, positiveRate);
  if (curve.length < 2) return 0;

  // recall の昇順でソート
  const sorted = [...curve].sort((a, b) => a.recall - b.recall);

  let ap = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dr = sorted[i].recall - sorted[i - 1].recall;
    const avgP = (sorted[i].precision + sorted[i - 1].precision) / 2;
    ap += dr * avgP;
  }
  return ap;
}
