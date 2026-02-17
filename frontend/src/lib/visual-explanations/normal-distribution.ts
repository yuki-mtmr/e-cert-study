/**
 * 誤差関数 (erf) の近似 — Abramowitz & Stegun 7.1.26
 * 最大誤差: 1.5e-7
 */
export function erf(x: number): number {
  if (x === 0) return 0;

  const sign = x >= 0 ? 1 : -1;
  const a = Math.abs(x);

  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const t = 1 / (1 + p * a);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const y = 1 - (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) * Math.exp(-a * a);

  return sign * y;
}

/**
 * 正規分布の確率密度関数 (PDF)
 * @param x - 評価点
 * @param mean - 平均（デフォルト 0）
 * @param std - 標準偏差（デフォルト 1）
 */
export function normalPdf(x: number, mean = 0, std = 1): number {
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
}

/**
 * 正規分布の累積分布関数 (CDF)
 * @param x - 評価点
 * @param mean - 平均（デフォルト 0）
 * @param std - 標準偏差（デフォルト 1）
 */
export function normalCdf(x: number, mean = 0, std = 1): number {
  const z = (x - mean) / std;
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}
