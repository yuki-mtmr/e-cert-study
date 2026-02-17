'use client';

import { useState, useMemo } from 'react';
import {
  computeCapacityCurve,
  getCapacityFittingState,
} from '@/lib/visual-explanations/curves';
import { ErrorCurveSlider } from './ErrorCurveSlider';
import { ErrorStatusDisplay } from './ErrorStatusDisplay';

const POINTS = 100;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 400;
const HEIGHT = 250;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

/** x(0~1) をSVG座標に変換 */
function toSvgX(x: number): number {
  return PADDING.left + x * PLOT_W;
}

/** error(0~1) をSVG座標に変換 */
function toSvgY(err: number): number {
  return PADDING.top + (1 - err) * PLOT_H;
}

/** 曲線の polyline points 文字列を生成 */
function buildPolylinePoints(
  getValue: (x: number) => number,
): string {
  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const x = i / POINTS;
    return `${toSvgX(x)},${toSvgY(getValue(x))}`;
  }).join(' ');
}

// ゾーン境界（getCapacityFittingState と一致）
const ZONE_BOUNDARIES = [0, 0.35, 0.7, 1];
const ZONE_COLORS = ['rgba(59,130,246,0.08)', 'rgba(34,197,94,0.1)', 'rgba(239,68,68,0.08)'];
const ZONE_IDS = ['zone-underfitting', 'zone-optimal', 'zone-overfitting'];

/** 図1: モデル容量 vs 誤差（U字カーブ） */
export function CapacityErrorGraph() {
  const [capacity, setCapacity] = useState(0.5);

  const point = useMemo(() => computeCapacityCurve(capacity), [capacity]);
  const fittingState = useMemo(() => getCapacityFittingState(capacity), [capacity]);

  const trainingPoints = useMemo(
    () => buildPolylinePoints((x) => computeCapacityCurve(x).trainingError),
    [],
  );
  const generalizationPoints = useMemo(
    () => buildPolylinePoints((x) => computeCapacityCurve(x).generalizationError),
    [],
  );

  return (
    <div className="space-y-3">
      {/* SVG グラフ */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-md"
        role="img"
        aria-label="モデル容量と誤差の関係グラフ"
      >
        {/* 背景ゾーン */}
        {ZONE_BOUNDARIES.slice(0, -1).map((start, i) => {
          const end = ZONE_BOUNDARIES[i + 1];
          return (
            <rect
              key={ZONE_IDS[i]}
              data-testid={ZONE_IDS[i]}
              x={toSvgX(start)}
              y={PADDING.top}
              width={toSvgX(end) - toSvgX(start)}
              height={PLOT_H}
              fill={ZONE_COLORS[i]}
            />
          );
        })}

        {/* 軸 */}
        <line
          x1={PADDING.left} y1={PADDING.top + PLOT_H}
          x2={PADDING.left + PLOT_W} y2={PADDING.top + PLOT_H}
          stroke="currentColor" strokeOpacity={0.3}
        />
        <line
          x1={PADDING.left} y1={PADDING.top}
          x2={PADDING.left} y2={PADDING.top + PLOT_H}
          stroke="currentColor" strokeOpacity={0.3}
        />

        {/* 曲線 */}
        <polyline
          points={trainingPoints}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={2}
        />
        <polyline
          points={generalizationPoints}
          fill="none"
          stroke="#EF4444"
          strokeWidth={2}
        />

        {/* スライダー位置の縦点線 */}
        <line
          x1={toSvgX(capacity)} y1={PADDING.top}
          x2={toSvgX(capacity)} y2={PADDING.top + PLOT_H}
          stroke="#6B7280" strokeWidth={1} strokeDasharray="4 2"
        />

        {/* ドット */}
        <circle cx={toSvgX(capacity)} cy={toSvgY(point.trainingError)} r={4} fill="#3B82F6" />
        <circle cx={toSvgX(capacity)} cy={toSvgY(point.generalizationError)} r={4} fill="#EF4444" />

        {/* ギャップバー */}
        <line
          x1={toSvgX(capacity)} y1={toSvgY(point.trainingError)}
          x2={toSvgX(capacity)} y2={toSvgY(point.generalizationError)}
          stroke="#F59E0B" strokeWidth={2}
        />

        {/* 軸ラベル */}
        <text
          x={PADDING.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {'モデルの複雑さ →'}
        </text>
        <text
          x={12}
          y={PADDING.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {'誤差 →'}
        </text>
      </svg>

      {/* 凡例 */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">訓練誤差</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">汎化誤差</span>
        </div>
      </div>

      {/* スライダー */}
      <ErrorCurveSlider
        label="モデルの複雑さ"
        value={capacity}
        onChange={setCapacity}
      />

      {/* ステータス */}
      <ErrorStatusDisplay
        trainingError={point.trainingError}
        generalizationError={point.generalizationError}
        fittingState={fittingState}
      />
    </div>
  );
}
