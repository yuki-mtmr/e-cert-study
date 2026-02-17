'use client';

import { useState, useMemo } from 'react';
import {
  getDefaultDataPoints,
  generateDataWithOutlier,
  computeRegressionLine,
  predictY,
  computeAllMetrics,
} from '@/lib/visual-explanations/regression-metrics';
import type { ResidualDisplayMode } from '@/lib/visual-explanations/regression-metrics';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 400;
const HEIGHT = 300;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

// データ範囲（x: 0〜12, y: -5〜25）
const X_MIN = 0;
const X_MAX = 12;
const Y_MIN = -5;
const Y_MAX = 25;

function toSvgX(x: number): number {
  return PADDING.left + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function toSvgY(y: number): number {
  return PADDING.top + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * PLOT_H;
}

/** セクション2: 残差ビジュアライゼーション */
export function ResidualPlot() {
  const [outlierStrength, setOutlierStrength] = useState(0);
  const [displayMode, setDisplayMode] = useState<ResidualDisplayMode>('mae');

  const points = useMemo(
    () => generateDataWithOutlier(outlierStrength),
    [outlierStrength],
  );
  const line = useMemo(() => computeRegressionLine(points), [points]);
  const metrics = useMemo(() => computeAllMetrics(points, line), [points, line]);

  // 残差の最大絶対値（MSEモードの線太さ正規化用）
  const maxResidual = useMemo(() => {
    let max = 0;
    for (const p of points) {
      max = Math.max(max, Math.abs(p.y - predictY(p.x, line)));
    }
    return max || 1;
  }, [points, line]);

  // 回帰直線の両端
  const lineX1 = X_MIN;
  const lineX2 = X_MAX;
  const lineY1 = predictY(lineX1, line);
  const lineY2 = predictY(lineX2, line);

  return (
    <div className="space-y-3">
      {/* SVG散布図 */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-lg"
        role="img"
        aria-label="残差ビジュアライゼーション"
      >
        {/* X軸 */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + PLOT_H}
          x2={PADDING.left + PLOT_W}
          y2={PADDING.top + PLOT_H}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        {/* Y軸 */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + PLOT_H}
          stroke="currentColor"
          strokeOpacity={0.3}
        />

        {/* 回帰直線 */}
        <line
          x1={toSvgX(lineX1)}
          y1={toSvgY(lineY1)}
          x2={toSvgX(lineX2)}
          y2={toSvgY(lineY2)}
          stroke="#6366F1"
          strokeWidth={2}
        />

        {/* 残差線 + データ点 */}
        {points.map((p, i) => {
          const predicted = predictY(p.x, line);
          const residual = Math.abs(p.y - predicted);
          const strokeWidth =
            displayMode === 'mse'
              ? 1 + (residual / maxResidual) * 4
              : 2;
          const color = displayMode === 'mse' ? '#EF4444' : '#F97316';

          return (
            <g key={i}>
              {/* 残差線（縦線） */}
              <line
                className="residual-line"
                x1={toSvgX(p.x)}
                y1={toSvgY(p.y)}
                x2={toSvgX(p.x)}
                y2={toSvgY(predicted)}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.6}
              />
              {/* データ点 */}
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y)}
                r={4}
                fill="#3B82F6"
              />
            </g>
          );
        })}

        {/* 軸ラベル */}
        <text
          x={PADDING.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          x
        </text>
        <text
          x={12}
          y={PADDING.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          y
        </text>
      </svg>

      {/* スライダー */}
      <ErrorCurveSlider
        label={`外れ値の強さ: ${outlierStrength.toFixed(2)}`}
        value={outlierStrength}
        onChange={setOutlierStrength}
        min={0}
        max={1}
        step={0.01}
      />

      {/* MAE/MSE切替 */}
      <div className="flex gap-2">
        <button
          type="button"
          role="button"
          aria-pressed={displayMode === 'mae'}
          onClick={() => setDisplayMode('mae')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            displayMode === 'mae'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          MAE
        </button>
        <button
          type="button"
          role="button"
          aria-pressed={displayMode === 'mse'}
          onClick={() => setDisplayMode('mse')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            displayMode === 'mse'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          MSE
        </button>
      </div>

      {/* 4指標の計算値 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
        <div data-testid="metric-mae" className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
          <div className="text-xs text-gray-500">MAE</div>
          <div className="font-mono font-bold">{metrics.mae.toFixed(3)}</div>
        </div>
        <div data-testid="metric-mse" className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="text-xs text-gray-500">MSE</div>
          <div className="font-mono font-bold">{metrics.mse.toFixed(3)}</div>
        </div>
        <div data-testid="metric-rmse" className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-xs text-gray-500">RMSE</div>
          <div className="font-mono font-bold">{metrics.rmse.toFixed(3)}</div>
        </div>
        <div data-testid="metric-r-squared" className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-gray-500">R²</div>
          <div className="font-mono font-bold">{metrics.rSquared.toFixed(3)}</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        外れ値スライダーを動かすとMAEは緩やかに、MSE/RMSEは急激に変化することを確認できます。
      </p>
    </div>
  );
}
