export type RegressionMetricId = 'mae' | 'mse' | 'rmse' | 'r-squared';

export interface RegressionFormula {
  prefix: string;
  summationBody: string;
  latex: string;
  hasSquareRoot?: boolean;
  specialForm?: 'r-squared';
}

export interface RegressionMetricDef {
  id: RegressionMetricId;
  name: string;
  enName: string;
  formula: RegressionFormula;
  description: string;
  tip: string;
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionLine {
  slope: number;
  intercept: number;
}

export interface ComputedMetrics {
  mae: number;
  mse: number;
  rmse: number;
  rSquared: number;
}

export interface UsageGuideRow {
  goal: string;
  metricId: RegressionMetricId;
  metricName: string;
  reason: string;
}

export interface MetricCharacteristic {
  id: RegressionMetricId;
  name: string;
  range: string;
  unit: string;
  outlierSensitivity: 'low' | 'medium' | 'high';
  outlierSensitivityLabel: string;
  keyPoint: string;
}

export type ResidualDisplayMode = 'mae' | 'mse';

/** 4つの回帰指標の定義データ */
export function getRegressionMetrics(): RegressionMetricDef[] {
  return [
    {
      id: 'mae',
      name: '平均絶対誤差',
      enName: 'Mean Absolute Error',
      formula: {
        prefix: '(1/N)',
        summationBody: '|y\u1D62 \u2212 \u0177\u1D62|',
        latex: '\\frac{1}{N}\\sum_{i=1}^{N}|y_i - \\hat{y}_i|',
      },
      description: '予測値と実測値の差の絶対値の平均。外れ値の影響が線形的。',
      tip: '絶対値で囲む \u2192 外れ値に強い',
    },
    {
      id: 'mse',
      name: '平均二乗誤差',
      enName: 'Mean Squared Error',
      formula: {
        prefix: '(1/N)',
        summationBody: '(y\u1D62 \u2212 \u0177\u1D62)\u00B2',
        latex: '\\frac{1}{N}\\sum_{i=1}^{N}(y_i - \\hat{y}_i)^2',
      },
      description: '予測値と実測値の差の二乗の平均。大きな誤差を強く罰する。',
      tip: '二乗 \u2192 大きな誤差を強調',
    },
    {
      id: 'rmse',
      name: '二乗平均平方根誤差',
      enName: 'Root Mean Squared Error',
      formula: {
        prefix: '\u221A{(1/N)',
        summationBody: '(y\u1D62 \u2212 \u0177\u1D62)\u00B2}',
        latex: '\\sqrt{\\frac{1}{N}\\sum_{i=1}^{N}(y_i - \\hat{y}_i)^2}',
        hasSquareRoot: true,
      },
      description: 'MSEの平方根。元データと同じ単位で誤差を表現できる。',
      tip: '\u30EB\u30FC\u30C8をかぶせる \u2192 y\u3068\u540C\u3058\u5358\u4F4D',
    },
    {
      id: 'r-squared',
      name: '決定係数',
      enName: 'R-squared',
      formula: {
        prefix: '1 \u2212',
        summationBody: 'SS_res / SS_tot',
        latex: 'R^2 = 1 - \\frac{SS_{res}}{SS_{tot}}',
        specialForm: 'r-squared',
      },
      description: 'モデルが全変動のうちどれだけ説明できたかの割合。1に近いほど良い。',
      tip: '1\u304B\u3089\u5F15\u304F \u2192 1\u306B\u8FD1\u3044\u307B\u3069\u826F\u3044',
    },
  ];
}

/** デフォルト散布図データ（10点、y \u2248 2x + 1 + noise） */
const DEFAULT_POINTS: DataPoint[] = [
  { x: 1, y: 3.2 },
  { x: 2, y: 4.8 },
  { x: 3, y: 7.5 },
  { x: 4, y: 8.6 },
  { x: 5, y: 11.2 },
  { x: 6, y: 13.1 },
  { x: 7, y: 14.7 },
  { x: 8, y: 17.3 },
  { x: 9, y: 18.9 },
  { x: 10, y: 21.5 },
];

export function getDefaultDataPoints(): DataPoint[] {
  return DEFAULT_POINTS.map((p) => ({ ...p }));
}

/** 外れ値付きデータ生成（strength: 0=なし, 1=最大） */
export function generateDataWithOutlier(strength: number): DataPoint[] {
  const points = getDefaultDataPoints();
  const lastIdx = points.length - 1;
  // 外れ値のオフセット（最大15ユニット下方向に移動）
  const outlierOffset = strength * -15;
  points[lastIdx] = {
    x: points[lastIdx].x,
    y: points[lastIdx].y + outlierOffset,
  };
  return points;
}

/** 最小二乗法で回帰直線を計算 */
export function computeRegressionLine(points: DataPoint[]): RegressionLine {
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/** 回帰直線上の予測値 */
export function predictY(x: number, line: RegressionLine): number {
  return line.slope * x + line.intercept;
}

/** MAE: (1/N) \u03A3|y\u1D62 \u2212 \u0177\u1D62| */
export function computeMAE(points: DataPoint[], line: RegressionLine): number {
  const n = points.length;
  let sum = 0;
  for (const p of points) {
    sum += Math.abs(p.y - predictY(p.x, line));
  }
  return sum / n;
}

/** MSE: (1/N) \u03A3(y\u1D62 \u2212 \u0177\u1D62)\u00B2 */
export function computeMSE(points: DataPoint[], line: RegressionLine): number {
  const n = points.length;
  let sum = 0;
  for (const p of points) {
    const residual = p.y - predictY(p.x, line);
    sum += residual * residual;
  }
  return sum / n;
}

/** RMSE: \u221AMSE */
export function computeRMSE(
  points: DataPoint[],
  line: RegressionLine,
): number {
  return Math.sqrt(computeMSE(points, line));
}

/** R\u00B2: 1 \u2212 SS_res / SS_tot */
export function computeRSquared(
  points: DataPoint[],
  line: RegressionLine,
): number {
  const n = points.length;
  let meanY = 0;
  for (const p of points) {
    meanY += p.y;
  }
  meanY /= n;

  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = predictY(p.x, line);
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }

  if (ssTot === 0) return 1;
  return 1 - ssRes / ssTot;
}

/** 4指標を一括計算 */
export function computeAllMetrics(
  points: DataPoint[],
  line: RegressionLine,
): ComputedMetrics {
  return {
    mae: computeMAE(points, line),
    mse: computeMSE(points, line),
    rmse: computeRMSE(points, line),
    rSquared: computeRSquared(points, line),
  };
}

/** 使い分けガイド */
export function getUsageGuide(): UsageGuideRow[] {
  return [
    {
      goal: '外れ値の影響を抑えたい',
      metricId: 'mae',
      metricName: 'MAE',
      reason: '絶対値で外れ値の影響が線形',
    },
    {
      goal: '大きな誤差を重点的に減らしたい',
      metricId: 'mse',
      metricName: 'MSE',
      reason: '二乗で大きな残差を強調',
    },
    {
      goal: '元データと同じ単位で誤差を把握したい',
      metricId: 'rmse',
      metricName: 'RMSE',
      reason: '\u221AMSEで単位を戻す',
    },
    {
      goal: 'モデルの説明力を0\u301C1で比較したい',
      metricId: 'r-squared',
      metricName: 'R\u00B2',
      reason: '全変動のうち説明できた割合',
    },
  ];
}

/** 特性比較データ */
export function getMetricCharacteristics(): MetricCharacteristic[] {
  return [
    {
      id: 'mae',
      name: 'MAE',
      range: '0\u301C\u221E',
      unit: 'y\u3068\u540C\u3058',
      outlierSensitivity: 'low',
      outlierSensitivityLabel: '\u4F4E',
      keyPoint: '\u7D76\u5BFE\u5024\u3067\u56F2\u3080\u306E\u304C\u7279\u5FB4',
    },
    {
      id: 'mse',
      name: 'MSE',
      range: '0\u301C\u221E',
      unit: 'y\u306E\u4E8C\u4E57',
      outlierSensitivity: 'high',
      outlierSensitivityLabel: '\u9AD8',
      keyPoint: '\u4E8C\u4E57\u3067\u5927\u304D\u306A\u8AA4\u5DEE\u3092\u5F37\u8ABF',
    },
    {
      id: 'rmse',
      name: 'RMSE',
      range: '0\u301C\u221E',
      unit: 'y\u3068\u540C\u3058',
      outlierSensitivity: 'high',
      outlierSensitivityLabel: '\u9AD8',
      keyPoint: 'MSE\u306E\u30EB\u30FC\u30C8\u3067\u5358\u4F4D\u3092\u623B\u3059',
    },
    {
      id: 'r-squared',
      name: 'R\u00B2',
      range: '\u901A\u5E380\u301C1',
      unit: '\u7121\u6B21\u5143',
      outlierSensitivity: 'medium',
      outlierSensitivityLabel: '\u4E2D',
      keyPoint: '1\u306B\u8FD1\u3044\u307B\u3069\u8AAC\u660E\u529B\u304C\u9AD8\u3044',
    },
  ];
}
