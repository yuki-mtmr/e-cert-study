import { describe, it, expect } from 'vitest';
import {
  getRegressionMetrics,
  getDefaultDataPoints,
  generateDataWithOutlier,
  computeRegressionLine,
  predictY,
  computeMAE,
  computeMSE,
  computeRMSE,
  computeRSquared,
  computeAllMetrics,
  getUsageGuide,
  getMetricCharacteristics,
} from '@/lib/visual-explanations/regression-metrics';
import type {
  RegressionMetricId,
  RegressionMetricDef,
  DataPoint,
  RegressionLine,
  ComputedMetrics,
  UsageGuideRow,
  MetricCharacteristic,
  ResidualDisplayMode,
} from '@/lib/visual-explanations/regression-metrics';

describe('getRegressionMetrics', () => {
  it('4つの指標定義を返す', () => {
    const metrics = getRegressionMetrics();
    expect(metrics).toHaveLength(4);
  });

  it('各指標にid,name,enName,formula,description,tipが含まれる', () => {
    const metrics = getRegressionMetrics();
    for (const m of metrics) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.enName).toBeTruthy();
      expect(m.formula).toBeDefined();
      expect(m.description).toBeTruthy();
      expect(m.tip).toBeTruthy();
    }
  });

  it('IDの順序は mae, mse, rmse, r-squared', () => {
    const ids = getRegressionMetrics().map((m) => m.id);
    expect(ids).toEqual(['mae', 'mse', 'rmse', 'r-squared']);
  });

  it('RMSEのformulaにhasSquareRoot: trueが設定されている', () => {
    const rmse = getRegressionMetrics().find((m) => m.id === 'rmse');
    expect(rmse?.formula.hasSquareRoot).toBe(true);
  });

  it('R²のformulaにspecialForm: r-squaredが設定されている', () => {
    const r2 = getRegressionMetrics().find((m) => m.id === 'r-squared');
    expect(r2?.formula.specialForm).toBe('r-squared');
  });
});

describe('getDefaultDataPoints', () => {
  it('10個のデータ点を返す', () => {
    const points = getDefaultDataPoints();
    expect(points).toHaveLength(10);
  });

  it('各点にx,yプロパティがある', () => {
    const points = getDefaultDataPoints();
    for (const p of points) {
      expect(typeof p.x).toBe('number');
      expect(typeof p.y).toBe('number');
    }
  });

  it('呼び出すたびに同じデータを返す（決定論的）', () => {
    const a = getDefaultDataPoints();
    const b = getDefaultDataPoints();
    expect(a).toEqual(b);
  });
});

describe('generateDataWithOutlier', () => {
  it('strength=0でデフォルトデータと同じ長さを返す', () => {
    const points = generateDataWithOutlier(0);
    expect(points).toHaveLength(getDefaultDataPoints().length);
  });

  it('strength=0では外れ値なし（デフォルトと同じ）', () => {
    const points = generateDataWithOutlier(0);
    const defaults = getDefaultDataPoints();
    expect(points).toEqual(defaults);
  });

  it('strength=1で最後の点のyが大きく変わる', () => {
    const defaults = getDefaultDataPoints();
    const withOutlier = generateDataWithOutlier(1);
    const lastDefault = defaults[defaults.length - 1];
    const lastOutlier = withOutlier[withOutlier.length - 1];
    // 外れ値は元の値からかなり離れるはず
    expect(Math.abs(lastOutlier.y - lastDefault.y)).toBeGreaterThan(1);
  });

  it('strength=0.5で中程度の外れ値', () => {
    const defaults = getDefaultDataPoints();
    const half = generateDataWithOutlier(0.5);
    const lastDefault = defaults[defaults.length - 1];
    const lastHalf = half[half.length - 1];
    const fullOutlier = generateDataWithOutlier(1);
    const lastFull = fullOutlier[fullOutlier.length - 1];
    // 0.5の外れ値は1.0よりも元データに近い
    expect(Math.abs(lastHalf.y - lastDefault.y)).toBeLessThan(
      Math.abs(lastFull.y - lastDefault.y),
    );
  });
});

describe('computeRegressionLine', () => {
  it('完全な直線データで正確な傾きと切片を返す', () => {
    // y = 2x + 1
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const line = computeRegressionLine(points);
    expect(line.slope).toBeCloseTo(2, 5);
    expect(line.intercept).toBeCloseTo(1, 5);
  });

  it('水平な直線データで傾き0を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ];
    const line = computeRegressionLine(points);
    expect(line.slope).toBeCloseTo(0, 5);
    expect(line.intercept).toBeCloseTo(5, 5);
  });

  it('デフォルトデータで回帰直線を返す', () => {
    const points = getDefaultDataPoints();
    const line = computeRegressionLine(points);
    expect(typeof line.slope).toBe('number');
    expect(typeof line.intercept).toBe('number');
    expect(Number.isFinite(line.slope)).toBe(true);
    expect(Number.isFinite(line.intercept)).toBe(true);
  });
});

describe('predictY', () => {
  it('回帰直線上の予測値を返す', () => {
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(predictY(0, line)).toBe(1);
    expect(predictY(3, line)).toBe(7);
    expect(predictY(-1, line)).toBe(-1);
  });
});

describe('computeMAE', () => {
  it('完全予測で0を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeMAE(points, line)).toBeCloseTo(0, 5);
  });

  it('既知の残差で正確な値を返す', () => {
    // y = 2x + 1, 実際: (0,2), (1,4) → 残差: |2-1|=1, |4-3|=1 → MAE = 1
    const points: DataPoint[] = [
      { x: 0, y: 2 },
      { x: 1, y: 4 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeMAE(points, line)).toBeCloseTo(1, 5);
  });

  it('負の残差も絶対値で扱う', () => {
    // 予測=1, 実際=0 → |0-1|=1
    const points: DataPoint[] = [{ x: 0, y: 0 }];
    const line: RegressionLine = { slope: 0, intercept: 1 };
    expect(computeMAE(points, line)).toBeCloseTo(1, 5);
  });
});

describe('computeMSE', () => {
  it('完全予測で0を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeMSE(points, line)).toBeCloseTo(0, 5);
  });

  it('既知の残差で正確な値を返す', () => {
    // 残差: 1, 1 → MSE = (1+1)/2 = 1
    const points: DataPoint[] = [
      { x: 0, y: 2 },
      { x: 1, y: 4 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeMSE(points, line)).toBeCloseTo(1, 5);
  });

  it('大きな残差を二乗で強調する', () => {
    // 残差: 3 → MSE = 9/1 = 9
    const points: DataPoint[] = [{ x: 0, y: 4 }];
    const line: RegressionLine = { slope: 0, intercept: 1 };
    expect(computeMSE(points, line)).toBeCloseTo(9, 5);
  });
});

describe('computeRMSE', () => {
  it('完全予測で0を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeRMSE(points, line)).toBeCloseTo(0, 5);
  });

  it('MSEの平方根を返す', () => {
    // MSE = 4 → RMSE = 2
    const points: DataPoint[] = [{ x: 0, y: 3 }];
    const line: RegressionLine = { slope: 0, intercept: 1 };
    // residual = 2, MSE = 4, RMSE = 2
    expect(computeRMSE(points, line)).toBeCloseTo(2, 5);
  });
});

describe('computeRSquared', () => {
  it('完全予測で1を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    expect(computeRSquared(points, line)).toBeCloseTo(1, 5);
  });

  it('平均値予測で0を返す', () => {
    // 全て同じy → 分散0 → 回帰直線は水平（y=平均）
    // SS_res = SS_tot → R² = 0 になるケース
    const points: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ];
    // 平均 = 2, 水平線 y=2 で予測
    const line: RegressionLine = { slope: 0, intercept: 2 };
    expect(computeRSquared(points, line)).toBeCloseTo(0, 5);
  });

  it('部分的な説明力で0〜1の値を返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 2.5 },
      { x: 2, y: 5.5 },
    ];
    const line = computeRegressionLine(points);
    const r2 = computeRSquared(points, line);
    expect(r2).toBeGreaterThan(0);
    expect(r2).toBeLessThanOrEqual(1);
  });
});

describe('computeAllMetrics', () => {
  it('4指標を一括計算して返す', () => {
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ];
    const line: RegressionLine = { slope: 2, intercept: 1 };
    const metrics = computeAllMetrics(points, line);
    expect(metrics.mae).toBeCloseTo(0, 5);
    expect(metrics.mse).toBeCloseTo(0, 5);
    expect(metrics.rmse).toBeCloseTo(0, 5);
    expect(metrics.rSquared).toBeCloseTo(1, 5);
  });

  it('ComputedMetrics型の全プロパティを持つ', () => {
    const points = getDefaultDataPoints();
    const line = computeRegressionLine(points);
    const metrics = computeAllMetrics(points, line);
    expect('mae' in metrics).toBe(true);
    expect('mse' in metrics).toBe(true);
    expect('rmse' in metrics).toBe(true);
    expect('rSquared' in metrics).toBe(true);
  });

  it('外れ値でMSEがMAEより大きく増加する', () => {
    const normal = getDefaultDataPoints();
    const lineNormal = computeRegressionLine(normal);
    const metricsNormal = computeAllMetrics(normal, lineNormal);

    const outlier = generateDataWithOutlier(1);
    const lineOutlier = computeRegressionLine(outlier);
    const metricsOutlier = computeAllMetrics(outlier, lineOutlier);

    // MSEの変化率 > MAEの変化率（外れ値感度の違い）
    const maeChange = metricsOutlier.mae - metricsNormal.mae;
    const mseChange = metricsOutlier.mse - metricsNormal.mse;
    expect(mseChange).toBeGreaterThan(maeChange);
  });
});

describe('getUsageGuide', () => {
  it('4行のガイドデータを返す', () => {
    const guide = getUsageGuide();
    expect(guide).toHaveLength(4);
  });

  it('各行にgoal,metricId,metricName,reasonが含まれる', () => {
    const guide = getUsageGuide();
    for (const row of guide) {
      expect(row.goal).toBeTruthy();
      expect(row.metricId).toBeTruthy();
      expect(row.metricName).toBeTruthy();
      expect(row.reason).toBeTruthy();
    }
  });

  it('4つの異なるmetricIdを持つ', () => {
    const ids = getUsageGuide().map((r) => r.metricId);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('getMetricCharacteristics', () => {
  it('4つの特性データを返す', () => {
    const chars = getMetricCharacteristics();
    expect(chars).toHaveLength(4);
  });

  it('各特性にid,name,range,unit,outlierSensitivity,keyPointが含まれる', () => {
    const chars = getMetricCharacteristics();
    for (const c of chars) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.range).toBeTruthy();
      expect(c.unit).toBeTruthy();
      expect(c.outlierSensitivity).toBeTruthy();
      expect(c.outlierSensitivityLabel).toBeTruthy();
      expect(c.keyPoint).toBeTruthy();
    }
  });

  it('MAEの外れ値感度はlow', () => {
    const mae = getMetricCharacteristics().find((c) => c.id === 'mae');
    expect(mae?.outlierSensitivity).toBe('low');
  });

  it('MSEの外れ値感度はhigh', () => {
    const mse = getMetricCharacteristics().find((c) => c.id === 'mse');
    expect(mse?.outlierSensitivity).toBe('high');
  });
});
