import { describe, it, expect } from 'vitest';
import { erf, normalPdf, normalCdf } from '@/lib/visual-explanations/normal-distribution';

describe('erf', () => {
  it('erf(0) = 0', () => {
    expect(erf(0)).toBe(0);
  });

  it('erf(x) は奇関数: erf(-x) = -erf(x)', () => {
    const values = [0.5, 1.0, 1.5, 2.0];
    for (const x of values) {
      expect(erf(-x)).toBeCloseTo(-erf(x), 10);
    }
  });

  it('erf(∞) → 1 に収束', () => {
    expect(erf(6)).toBeCloseTo(1, 5);
  });

  it('erf(-∞) → -1 に収束', () => {
    expect(erf(-6)).toBeCloseTo(-1, 5);
  });

  it('既知の値: erf(1) ≈ 0.8427', () => {
    expect(erf(1)).toBeCloseTo(0.8427, 3);
  });

  it('既知の値: erf(0.5) ≈ 0.5205', () => {
    expect(erf(0.5)).toBeCloseTo(0.5205, 3);
  });

  it('既知の値: erf(2) ≈ 0.9953', () => {
    expect(erf(2)).toBeCloseTo(0.9953, 3);
  });
});

describe('normalPdf', () => {
  it('標準正規分布のピーク: normalPdf(0) ≈ 0.3989', () => {
    expect(normalPdf(0)).toBeCloseTo(0.3989, 3);
  });

  it('対称性: normalPdf(-x) = normalPdf(x)', () => {
    expect(normalPdf(-1)).toBeCloseTo(normalPdf(1), 10);
    expect(normalPdf(-2)).toBeCloseTo(normalPdf(2), 10);
  });

  it('ピークから離れると値が小さくなる', () => {
    expect(normalPdf(0)).toBeGreaterThan(normalPdf(1));
    expect(normalPdf(1)).toBeGreaterThan(normalPdf(2));
  });

  it('カスタム平均・標準偏差', () => {
    // N(5, 2^2) のピークは x=5
    expect(normalPdf(5, 5, 2)).toBeCloseTo(1 / (2 * Math.sqrt(2 * Math.PI)), 4);
  });

  it('常に非負の値', () => {
    for (let x = -5; x <= 5; x += 0.5) {
      expect(normalPdf(x)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('normalCdf', () => {
  it('normalCdf(0) = 0.5', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 5);
  });

  it('normalCdf(-∞) → 0', () => {
    expect(normalCdf(-6)).toBeCloseTo(0, 5);
  });

  it('normalCdf(∞) → 1', () => {
    expect(normalCdf(6)).toBeCloseTo(1, 5);
  });

  it('単調増加', () => {
    const values = [-3, -2, -1, 0, 1, 2, 3];
    for (let i = 0; i < values.length - 1; i++) {
      expect(normalCdf(values[i])).toBeLessThan(normalCdf(values[i + 1]));
    }
  });

  it('対称性: normalCdf(-x) + normalCdf(x) = 1', () => {
    const values = [0.5, 1.0, 1.5, 2.0];
    for (const x of values) {
      expect(normalCdf(-x) + normalCdf(x)).toBeCloseTo(1, 5);
    }
  });

  it('既知の値: normalCdf(1) ≈ 0.8413', () => {
    expect(normalCdf(1)).toBeCloseTo(0.8413, 3);
  });

  it('カスタム平均・標準偏差: normalCdf(5, 5, 2) = 0.5', () => {
    expect(normalCdf(5, 5, 2)).toBeCloseTo(0.5, 5);
  });
});
