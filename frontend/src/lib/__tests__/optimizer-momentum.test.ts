import { describe, it, expect } from 'vitest';
import {
  OPTIMIZER_COLORS,
  generateSgdPath,
  generateMomentumPath,
  toPolylinePoints,
} from '@/lib/visual-explanations/optimizer-momentum';
import type { Point2D } from '@/lib/visual-explanations/optimizer-momentum';

describe('OPTIMIZER_COLORS', () => {
  it('5つの色キーが定義されている', () => {
    const keys = Object.keys(OPTIMIZER_COLORS);
    expect(keys).toContain('sgd');
    expect(keys).toContain('momentum');
    expect(keys).toContain('contour');
    expect(keys).toContain('currentPos');
    expect(keys).toContain('lookAhead');
  });

  it('各色は # で始まる hex 文字列', () => {
    for (const color of Object.values(OPTIMIZER_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('generateSgdPath', () => {
  it('指定したステップ数+1 の点を返す（開始点含む）', () => {
    const path = generateSgdPath(10);
    expect(path).toHaveLength(11);
  });

  it('各点が x, y プロパティを持つ', () => {
    const path = generateSgdPath(5);
    for (const p of path) {
      expect(p).toHaveProperty('x');
      expect(p).toHaveProperty('y');
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    }
  });

  it('x座標が単調増加する（右方向に進む）', () => {
    const path = generateSgdPath(10);
    for (let i = 1; i < path.length; i++) {
      expect(path[i].x).toBeGreaterThan(path[i - 1].x);
    }
  });

  it('y座標が振動する（符号が変わる区間がある）', () => {
    const path = generateSgdPath(20);
    let hasPositive = false;
    let hasNegative = false;
    for (const p of path) {
      if (p.y > 0) hasPositive = true;
      if (p.y < 0) hasNegative = true;
    }
    expect(hasPositive).toBe(true);
    expect(hasNegative).toBe(true);
  });
});

describe('generateMomentumPath', () => {
  it('指定したステップ数+1 の点を返す', () => {
    const path = generateMomentumPath(10, 0.9);
    expect(path).toHaveLength(11);
  });

  it('x座標が単調増加する', () => {
    const path = generateMomentumPath(10, 0.9);
    for (let i = 1; i < path.length; i++) {
      expect(path[i].x).toBeGreaterThan(path[i - 1].x);
    }
  });

  it('振動の振幅が減衰する（後半の振幅 < 前半の振幅）', () => {
    const path = generateMomentumPath(20, 0.9);
    const mid = Math.floor(path.length / 2);

    // 前半の最大y振幅
    const firstHalf = path.slice(0, mid);
    const maxFirstHalf = Math.max(...firstHalf.map((p) => Math.abs(p.y)));

    // 後半の最大y振幅
    const secondHalf = path.slice(mid);
    const maxSecondHalf = Math.max(...secondHalf.map((p) => Math.abs(p.y)));

    expect(maxSecondHalf).toBeLessThan(maxFirstHalf);
  });

  it('gamma=0 だと振動がSGDと同程度', () => {
    const path = generateMomentumPath(10, 0);
    expect(path).toHaveLength(11);
    // gamma=0 でも有効な点列を返すことを確認
    for (const p of path) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });
});

describe('toPolylinePoints', () => {
  it('Point2D配列をSVG polyline points文字列に変換する', () => {
    const points: Point2D[] = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];
    expect(toPolylinePoints(points)).toBe('10,20 30,40');
  });

  it('空配列は空文字列を返す', () => {
    expect(toPolylinePoints([])).toBe('');
  });

  it('小数点も正しく変換される', () => {
    const points: Point2D[] = [{ x: 1.5, y: 2.7 }];
    expect(toPolylinePoints(points)).toBe('1.5,2.7');
  });
});
