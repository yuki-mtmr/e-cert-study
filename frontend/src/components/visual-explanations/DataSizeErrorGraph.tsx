'use client';

import { useState, useMemo } from 'react';
import { computeDataSizeCurve } from '@/lib/visual-explanations/curves';
import { ErrorCurveSlider } from './ErrorCurveSlider';
import { ErrorStatusDisplay } from './ErrorStatusDisplay';
import type { FittingState } from '@/lib/visual-explanations/curves';

const POINTS = 100;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 400;
const HEIGHT = 250;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

function toSvgX(x: number): number {
  return PADDING.left + x * PLOT_W;
}

function toSvgY(err: number): number {
  return PADDING.top + (1 - err) * PLOT_H;
}

function buildPolylinePoints(
  getValue: (x: number) => number,
): string {
  return Array.from({ length: POINTS + 1 }, (_, i) => {
    const x = i / POINTS;
    return `${toSvgX(x)},${toSvgY(getValue(x))}`;
  }).join(' ');
}

/** データ量に基づく適合状態（ギャップの大きさで判定） */
function getDataSizeFittingState(x: number): FittingState {
  const point = computeDataSizeCurve(x);
  const gap = point.generalizationError - point.trainingError;
  if (gap > 0.4) return 'overfitting';
  if (gap > 0.15) return 'optimal';
  return 'underfitting';
}

/** 図2: 学習データ量 vs 誤差 */
export function DataSizeErrorGraph() {
  const [dataSize, setDataSize] = useState(0.5);

  const point = useMemo(() => computeDataSizeCurve(dataSize), [dataSize]);
  const fittingState = useMemo(() => getDataSizeFittingState(dataSize), [dataSize]);

  const trainingPoints = useMemo(
    () => buildPolylinePoints((x) => computeDataSizeCurve(x).trainingError),
    [],
  );
  const generalizationPoints = useMemo(
    () => buildPolylinePoints((x) => computeDataSizeCurve(x).generalizationError),
    [],
  );

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-md"
        role="img"
        aria-label="学習データ量と誤差の関係グラフ"
      >
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
          x1={toSvgX(dataSize)} y1={PADDING.top}
          x2={toSvgX(dataSize)} y2={PADDING.top + PLOT_H}
          stroke="#6B7280" strokeWidth={1} strokeDasharray="4 2"
        />

        {/* ドット */}
        <circle cx={toSvgX(dataSize)} cy={toSvgY(point.trainingError)} r={4} fill="#3B82F6" />
        <circle cx={toSvgX(dataSize)} cy={toSvgY(point.generalizationError)} r={4} fill="#EF4444" />

        {/* ギャップバー */}
        <line
          x1={toSvgX(dataSize)} y1={toSvgY(point.trainingError)}
          x2={toSvgX(dataSize)} y2={toSvgY(point.generalizationError)}
          stroke="#F59E0B" strokeWidth={2}
        />

        {/* 軸ラベル */}
        <text
          x={PADDING.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {'学習データ量 →'}
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
        label="学習データ量"
        value={dataSize}
        onChange={setDataSize}
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
