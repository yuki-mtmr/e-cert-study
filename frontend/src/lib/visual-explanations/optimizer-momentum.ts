export interface Point2D {
  x: number;
  y: number;
}

export const OPTIMIZER_COLORS = {
  sgd: '#EF4444',       // red — SGD軌跡
  momentum: '#3B82F6',  // blue — Momentum軌跡
  contour: '#D1D5DB',   // gray-300 — 等高線
  currentPos: '#3B82F6', // blue — 現在位置
  lookAhead: '#F59E0B', // amber — NAG先読み位置
} as const;

/**
 * 細長い楕円谷でのSGD軌跡（振動あり）
 * y方向に振動しながらx方向に少しずつ進む
 * @returns steps+1 個の点（開始点含む）
 */
export function generateSgdPath(steps: number): Point2D[] {
  const points: Point2D[] = [];
  const xStep = 8;
  const amplitude = 25;

  for (let i = 0; i <= steps; i++) {
    const x = 20 + i * xStep;
    // 減衰なし振動: 谷の壁で振り子のように往復
    const y = amplitude * Math.sin(i * 1.8);
    points.push({ x, y });
  }
  return points;
}

/**
 * Momentum軌跡（振動減衰）
 * gammaによる慣性で振動が減衰し素早く谷底へ
 * @returns steps+1 個の点（開始点含む）
 */
export function generateMomentumPath(
  steps: number,
  gamma: number,
): Point2D[] {
  const points: Point2D[] = [];
  const xStep = 10;
  const amplitude = 25;
  // 減衰係数: gammaが大きいほど速く減衰
  const decay = 0.15 + gamma * 0.15;

  for (let i = 0; i <= steps; i++) {
    const x = 20 + i * xStep;
    const y = amplitude * Math.exp(-decay * i) * Math.sin(i * 1.8);
    points.push({ x, y });
  }
  return points;
}

/** Point2D[] → SVG polyline points属性文字列 */
export function toPolylinePoints(points: Point2D[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}
