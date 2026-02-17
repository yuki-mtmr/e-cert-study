/** バイアス-バリアンス-ノイズ分解のビジュアル用純粋関数 */

export interface TargetDot {
  x: number;
  y: number;
}

export interface Centroid {
  x: number;
  y: number;
}

export interface TargetScenario {
  id: string;
  label: string;
  caption: string;
  biasLevel: 'low' | 'high';
  varianceLevel: 'low' | 'high';
  bias: number;
  variance: number;
}

/**
 * Box-Muller変換: 一様分布 (0,1) の2値から標準正規分布の2値を生成
 * z0 = sqrt(-2 * ln(u1)) * cos(2π * u2)
 * z1 = sqrt(-2 * ln(u1)) * sin(2π * u2)
 */
export function boxMuller(u1: number, u2: number): [number, number] {
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * ドット群を生成（バイアスとバリアンスに基づく）
 * seed を渡すと決定的な出力を返す
 */
export function generateDots(
  n: number,
  biasX: number,
  biasY: number,
  variance: number,
  seed?: [number, number][],
): TargetDot[] {
  const dots: TargetDot[] = [];
  for (let i = 0; i < n; i++) {
    const pair = seed
      ? seed[i]
      : [(i + 1) / (n + 1), ((i * 7 + 3) % (n + 1)) / (n + 1)];
    // u1は0にならないように保護
    const u1 = Math.max(pair[0], 0.001);
    const u2 = pair[1];
    const [z0, z1] = boxMuller(u1, u2);
    const x = Math.max(-1, Math.min(1, biasX + z0 * variance * 0.3));
    const y = Math.max(-1, Math.min(1, biasY + z1 * variance * 0.3));
    dots.push({ x, y });
  }
  return dots;
}

/** ドット群の重心を計算 */
export function computeCentroid(dots: TargetDot[]): Centroid {
  if (dots.length === 0) return { x: 0, y: 0 };
  const sumX = dots.reduce((acc, d) => acc + d.x, 0);
  const sumY = dots.reduce((acc, d) => acc + d.y, 0);
  return { x: sumX / dots.length, y: sumY / dots.length };
}

/** ドット群の重心からの標準偏差（散らばり半径） */
export function computeVarianceRadius(
  dots: TargetDot[],
  centroid: Centroid,
): number {
  if (dots.length === 0) return 0;
  const sumSqDist = dots.reduce(
    (acc, d) => acc + (d.x - centroid.x) ** 2 + (d.y - centroid.y) ** 2,
    0,
  );
  return Math.sqrt(sumSqDist / dots.length);
}

/** 重心から原点（的の中心）までの距離 = バイアスの大きさ */
export function computeBiasDistance(centroid: Centroid): number {
  return Math.sqrt(centroid.x ** 2 + centroid.y ** 2);
}

/** 4つの静的シナリオ（低/高バイアス × 低/高バリアンス） */
export function getStaticScenarios(): TargetScenario[] {
  return [
    {
      id: 'low-bias-low-var',
      label: '低Bias・低Variance',
      caption: '理想的：的の中心付近に密集',
      biasLevel: 'low',
      varianceLevel: 'low',
      bias: 0.05,
      variance: 0.05,
    },
    {
      id: 'high-bias-low-var',
      label: '高Bias・低Variance',
      caption: '系統的なズレ：外れた位置に密集',
      biasLevel: 'high',
      varianceLevel: 'low',
      bias: 0.6,
      variance: 0.05,
    },
    {
      id: 'low-bias-high-var',
      label: '低Bias・高Variance',
      caption: '不安定：中心を囲んで散らばる',
      biasLevel: 'low',
      varianceLevel: 'high',
      bias: 0.05,
      variance: 0.5,
    },
    {
      id: 'high-bias-high-var',
      label: '高Bias・高Variance',
      caption: '最悪：外れた位置にバラバラ',
      biasLevel: 'high',
      varianceLevel: 'high',
      bias: 0.6,
      variance: 0.5,
    },
  ];
}

/** 時刻tと振幅からノイズオフセットを計算（的の揺れ） */
export function computeNoiseOffset(
  time: number,
  amplitude: number,
): { dx: number; dy: number } {
  if (amplitude === 0) return { dx: 0, dy: 0 };
  const dx = amplitude * Math.sin(time * 2.3);
  const dy = amplitude * Math.cos(time * 1.7);
  return { dx, dy };
}
