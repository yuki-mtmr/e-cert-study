import { describe, it, expect } from 'vitest';
import {
  boxMuller,
  generateDots,
  computeCentroid,
  computeVarianceRadius,
  computeBiasDistance,
  getStaticScenarios,
  computeNoiseOffset,
} from '@/lib/visual-explanations/bias-variance';
import type {
  TargetDot,
  TargetScenario,
} from '@/lib/visual-explanations/bias-variance';

describe('boxMuller', () => {
  it('2つの正規分布値を返す', () => {
    const [z0, z1] = boxMuller(0.5, 0.5);
    expect(typeof z0).toBe('number');
    expect(typeof z1).toBe('number');
    expect(Number.isFinite(z0)).toBe(true);
    expect(Number.isFinite(z1)).toBe(true);
  });

  it('u1=0.5, u2=0.5 で既知の値を返す', () => {
    // sqrt(-2*ln(0.5)) * cos(2*PI*0.5) = sqrt(1.3863) * cos(PI) = 1.1774 * -1 = -1.1774
    const [z0, z1] = boxMuller(0.5, 0.5);
    expect(z0).toBeCloseTo(-1.1774, 3);
    // sqrt(-2*ln(0.5)) * sin(2*PI*0.5) = sqrt(1.3863) * sin(PI) ≈ 0
    expect(z1).toBeCloseTo(0, 3);
  });

  it('異なる入力で異なる出力を返す', () => {
    const [a0, a1] = boxMuller(0.3, 0.7);
    const [b0, b1] = boxMuller(0.7, 0.3);
    expect(a0).not.toBeCloseTo(b0, 5);
  });
});

describe('generateDots', () => {
  it('指定した数のドットを生成する', () => {
    const dots = generateDots(10, 0, 0, 0.3);
    expect(dots).toHaveLength(10);
  });

  it('各ドットがx, yプロパティを持つ', () => {
    const dots = generateDots(5, 0, 0, 0.3);
    dots.forEach((dot) => {
      expect(dot).toHaveProperty('x');
      expect(dot).toHaveProperty('y');
      expect(typeof dot.x).toBe('number');
      expect(typeof dot.y).toBe('number');
    });
  });

  it('全ドットが[-1, 1]の範囲内', () => {
    const dots = generateDots(50, 0.8, 0.8, 0.9);
    dots.forEach((dot) => {
      expect(dot.x).toBeGreaterThanOrEqual(-1);
      expect(dot.x).toBeLessThanOrEqual(1);
      expect(dot.y).toBeGreaterThanOrEqual(-1);
      expect(dot.y).toBeLessThanOrEqual(1);
    });
  });

  it('バイアスが大きいとドットが中心から離れる', () => {
    const lowBias = generateDots(30, 0.05, 0.05, 0.05);
    const highBias = generateDots(30, 0.6, 0.6, 0.05);
    const lowCentroid = computeCentroid(lowBias);
    const highCentroid = computeCentroid(highBias);
    const lowDist = Math.sqrt(lowCentroid.x ** 2 + lowCentroid.y ** 2);
    const highDist = Math.sqrt(highCentroid.x ** 2 + highCentroid.y ** 2);
    expect(highDist).toBeGreaterThan(lowDist);
  });

  it('seed指定で決定的な出力を返す', () => {
    const seed: [number, number][] = Array.from({ length: 5 }, (_, i) => [
      (i + 1) / 6,
      (i + 2) / 7,
    ]);
    const dots1 = generateDots(5, 0.3, 0.3, 0.3, seed);
    const dots2 = generateDots(5, 0.3, 0.3, 0.3, seed);
    expect(dots1).toEqual(dots2);
  });
});

describe('computeCentroid', () => {
  it('単一ドットの重心はそのドット自身', () => {
    const centroid = computeCentroid([{ x: 0.5, y: -0.3 }]);
    expect(centroid.x).toBeCloseTo(0.5);
    expect(centroid.y).toBeCloseTo(-0.3);
  });

  it('対称なドットの重心は中間点', () => {
    const dots: TargetDot[] = [
      { x: -0.5, y: 0 },
      { x: 0.5, y: 0 },
    ];
    const centroid = computeCentroid(dots);
    expect(centroid.x).toBeCloseTo(0);
    expect(centroid.y).toBeCloseTo(0);
  });

  it('空配列は原点を返す', () => {
    const centroid = computeCentroid([]);
    expect(centroid.x).toBe(0);
    expect(centroid.y).toBe(0);
  });
});

describe('computeVarianceRadius', () => {
  it('全ドットが重心と同じ位置なら0', () => {
    const dots: TargetDot[] = [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
    ];
    const centroid = computeCentroid(dots);
    expect(computeVarianceRadius(dots, centroid)).toBe(0);
  });

  it('散らばっているドットの方が大きい半径', () => {
    const tight: TargetDot[] = [
      { x: 0, y: 0 },
      { x: 0.01, y: 0.01 },
    ];
    const spread: TargetDot[] = [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: 0.5 },
    ];
    const tightC = computeCentroid(tight);
    const spreadC = computeCentroid(spread);
    expect(computeVarianceRadius(spread, spreadC)).toBeGreaterThan(
      computeVarianceRadius(tight, tightC),
    );
  });

  it('正の数を返す', () => {
    const dots = generateDots(10, 0.3, 0.3, 0.5);
    const centroid = computeCentroid(dots);
    expect(computeVarianceRadius(dots, centroid)).toBeGreaterThanOrEqual(0);
  });
});

describe('computeBiasDistance', () => {
  it('原点の重心はバイアス距離0', () => {
    expect(computeBiasDistance({ x: 0, y: 0 })).toBe(0);
  });

  it('(0.3, 0.4)のバイアス距離は0.5', () => {
    expect(computeBiasDistance({ x: 0.3, y: 0.4 })).toBeCloseTo(0.5);
  });

  it('常に非負の値', () => {
    expect(computeBiasDistance({ x: -0.5, y: -0.5 })).toBeGreaterThan(0);
  });
});

describe('getStaticScenarios', () => {
  it('4つのシナリオを返す', () => {
    const scenarios = getStaticScenarios();
    expect(scenarios).toHaveLength(4);
  });

  it('各シナリオに必要なプロパティがある', () => {
    const scenarios = getStaticScenarios();
    scenarios.forEach((s) => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('caption');
      expect(s).toHaveProperty('biasLevel');
      expect(s).toHaveProperty('varianceLevel');
      expect(s).toHaveProperty('bias');
      expect(s).toHaveProperty('variance');
    });
  });

  it('4つのバイアス×バリアンス組み合わせを網羅', () => {
    const scenarios = getStaticScenarios();
    const combos = scenarios.map(
      (s) => `${s.biasLevel}-${s.varianceLevel}`,
    );
    expect(combos).toContain('low-low');
    expect(combos).toContain('high-low');
    expect(combos).toContain('low-high');
    expect(combos).toContain('high-high');
  });

  it('IDが全てユニーク', () => {
    const scenarios = getStaticScenarios();
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('computeNoiseOffset', () => {
  it('振幅0ならオフセット0', () => {
    const { dx, dy } = computeNoiseOffset(1.0, 0);
    expect(dx).toBe(0);
    expect(dy).toBe(0);
  });

  it('dx, dyを返す', () => {
    const offset = computeNoiseOffset(0.5, 0.3);
    expect(typeof offset.dx).toBe('number');
    expect(typeof offset.dy).toBe('number');
  });

  it('異なる時刻で異なるオフセットを返す', () => {
    const a = computeNoiseOffset(0, 0.5);
    const b = computeNoiseOffset(1, 0.5);
    // 少なくとも片方は異なる
    expect(a.dx !== b.dx || a.dy !== b.dy).toBe(true);
  });

  it('オフセットは振幅に比例する範囲内', () => {
    const amplitude = 0.5;
    for (let t = 0; t < 10; t += 0.5) {
      const { dx, dy } = computeNoiseOffset(t, amplitude);
      expect(Math.abs(dx)).toBeLessThanOrEqual(amplitude + 0.001);
      expect(Math.abs(dy)).toBeLessThanOrEqual(amplitude + 0.001);
    }
  });
});
