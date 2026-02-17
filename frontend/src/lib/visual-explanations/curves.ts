/** 訓練誤差・汎化誤差のグラフ用曲線データ（純粋関数） */

export interface CurvePoint {
  trainingError: number;
  generalizationError: number;
}

export type FittingState = 'underfitting' | 'optimal' | 'overfitting';

/**
 * モデル容量(x: 0~1) に対する訓練誤差・汎化誤差を計算
 * - 訓練誤差: 容量が増すほど減少
 * - 汎化誤差: U字カーブ（中間で最小、両端で上昇）
 */
export function computeCapacityCurve(x: number): CurvePoint {
  const trainingError = 0.8 * (1 - x) ** 2 + 0.05;
  const generalizationError = 0.8 * (1 - x) ** 2 + 0.8 * x ** 3 + 0.1;
  return { trainingError, generalizationError };
}

/**
 * 学習データ量(x: 0~1) に対する訓練誤差・汎化誤差を計算
 * - 訓練誤差: データが増すほど増加（収束）
 * - 汎化誤差: データが増すほど減少（収束）
 */
export function computeDataSizeCurve(x: number): CurvePoint {
  const trainingError = 0.1 + 0.3 * (1 - Math.exp(-3 * x));
  const generalizationError = 0.9 * Math.exp(-3 * x) + 0.15;
  return { trainingError, generalizationError };
}

/** モデル容量(x)に対する適合状態を判定 */
export function getCapacityFittingState(x: number): FittingState {
  if (x < 0.35) return 'underfitting';
  if (x < 0.7) return 'optimal';
  return 'overfitting';
}
