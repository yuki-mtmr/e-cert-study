import { describe, it, expect } from 'vitest';
import {
  computeCapacityCurve,
  computeDataSizeCurve,
  getCapacityFittingState,
} from '@/lib/visual-explanations/curves';
import type { CurvePoint, FittingState } from '@/lib/visual-explanations/curves';

describe('computeCapacityCurve', () => {
  it('x=0 で訓練誤差が高い（過少適合）', () => {
    const point = computeCapacityCurve(0);
    expect(point.trainingError).toBeCloseTo(0.85, 1);
    expect(point.generalizationError).toBeCloseTo(0.9, 1);
  });

  it('x=1 で訓練誤差が最低付近', () => {
    const point = computeCapacityCurve(1);
    expect(point.trainingError).toBeCloseTo(0.05, 1);
  });

  it('x=1 で汎化誤差が再上昇（過剰適合）', () => {
    const point = computeCapacityCurve(1);
    expect(point.generalizationError).toBeGreaterThan(0.5);
  });

  it('訓練誤差は単調減少する', () => {
    let prev = computeCapacityCurve(0).trainingError;
    for (let x = 0.1; x <= 1; x += 0.1) {
      const current = computeCapacityCurve(x).trainingError;
      expect(current).toBeLessThanOrEqual(prev + 0.001);
      prev = current;
    }
  });

  it('汎化誤差はU字カーブを描く（中間で最小値を持つ）', () => {
    const start = computeCapacityCurve(0).generalizationError;
    const mid = computeCapacityCurve(0.5).generalizationError;
    const end = computeCapacityCurve(1).generalizationError;
    expect(mid).toBeLessThan(start);
    expect(mid).toBeLessThan(end);
  });

  it('全範囲で誤差値が0以上1以下', () => {
    for (let x = 0; x <= 1; x += 0.05) {
      const point = computeCapacityCurve(x);
      expect(point.trainingError).toBeGreaterThanOrEqual(0);
      expect(point.trainingError).toBeLessThanOrEqual(1);
      expect(point.generalizationError).toBeGreaterThanOrEqual(0);
      expect(point.generalizationError).toBeLessThanOrEqual(1);
    }
  });

  it('訓練誤差は常に汎化誤差以下', () => {
    for (let x = 0; x <= 1; x += 0.05) {
      const point = computeCapacityCurve(x);
      expect(point.trainingError).toBeLessThanOrEqual(
        point.generalizationError + 0.01,
      );
    }
  });
});

describe('computeDataSizeCurve', () => {
  it('x=0 で訓練誤差が低く汎化誤差が高い', () => {
    const point = computeDataSizeCurve(0);
    expect(point.trainingError).toBeCloseTo(0.1, 1);
    expect(point.generalizationError).toBeCloseTo(1.05, 1);
  });

  it('x=1 で両誤差が収束する（ギャップが小さい）', () => {
    const point = computeDataSizeCurve(1);
    const gap = Math.abs(
      point.generalizationError - point.trainingError,
    );
    expect(gap).toBeLessThan(0.2);
  });

  it('訓練誤差は単調増加する', () => {
    let prev = computeDataSizeCurve(0).trainingError;
    for (let x = 0.1; x <= 1; x += 0.1) {
      const current = computeDataSizeCurve(x).trainingError;
      expect(current).toBeGreaterThanOrEqual(prev - 0.001);
      prev = current;
    }
  });

  it('汎化誤差は単調減少する', () => {
    let prev = computeDataSizeCurve(0).generalizationError;
    for (let x = 0.1; x <= 1; x += 0.1) {
      const current = computeDataSizeCurve(x).generalizationError;
      expect(current).toBeLessThanOrEqual(prev + 0.001);
      prev = current;
    }
  });

  it('全範囲で誤差値が0以上', () => {
    for (let x = 0; x <= 1; x += 0.05) {
      const point = computeDataSizeCurve(x);
      expect(point.trainingError).toBeGreaterThanOrEqual(0);
      expect(point.generalizationError).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getCapacityFittingState', () => {
  it('x=0 は underfitting', () => {
    expect(getCapacityFittingState(0)).toBe('underfitting');
  });

  it('x=0.2 は underfitting', () => {
    expect(getCapacityFittingState(0.2)).toBe('underfitting');
  });

  it('x=0.5 付近は optimal', () => {
    expect(getCapacityFittingState(0.5)).toBe('optimal');
  });

  it('x=0.9 は overfitting', () => {
    expect(getCapacityFittingState(0.9)).toBe('overfitting');
  });

  it('x=1 は overfitting', () => {
    expect(getCapacityFittingState(1)).toBe('overfitting');
  });

  it('戻り値はFittingState型のいずれか', () => {
    const validStates: FittingState[] = ['underfitting', 'optimal', 'overfitting'];
    for (let x = 0; x <= 1; x += 0.1) {
      expect(validStates).toContain(getCapacityFittingState(x));
    }
  });
});
