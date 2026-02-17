'use client';

import { useState, useMemo } from 'react';
import {
  computeRocCurve,
  computeAuc,
  computeTprFpr,
} from '@/lib/visual-explanations/roc-pr-curves';
import { normalPdf } from '@/lib/visual-explanations/normal-distribution';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 300;
const HEIGHT = 280;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

function toSvgX(x: number): number {
  return PADDING.left + x * PLOT_W;
}
function toSvgY(y: number): number {
  return PADDING.top + (1 - y) * PLOT_H;
}

// 分布図用の定数
const DIST_WIDTH = 300;
const DIST_HEIGHT = 150;
const DIST_PAD = { top: 10, right: 20, bottom: 30, left: 50 };
const DIST_PW = DIST_WIDTH - DIST_PAD.left - DIST_PAD.right;
const DIST_PH = DIST_HEIGHT - DIST_PAD.top - DIST_PAD.bottom;

function toDistX(x: number, xMin: number, xMax: number): number {
  return DIST_PAD.left + ((x - xMin) / (xMax - xMin)) * DIST_PW;
}
function toDistY(y: number, yMax: number): number {
  return DIST_PAD.top + (1 - y / yMax) * DIST_PH;
}

/** セクション1: ROC曲線 + 正規分布 + 閾値スライダー */
export function RocCurveSection() {
  const [threshold, setThreshold] = useState(1.0);
  const [dPrime, setDPrime] = useState(2.0);

  const rocCurve = useMemo(() => computeRocCurve(dPrime), [dPrime]);
  const auc = useMemo(() => computeAuc(dPrime), [dPrime]);
  const { tpr, fpr } = useMemo(
    () => computeTprFpr(threshold, dPrime),
    [threshold, dPrime],
  );

  // ROC曲線のpolyline
  const rocPoints = useMemo(
    () => rocCurve.map((p) => `${toSvgX(p.fpr)},${toSvgY(p.tpr)}`).join(' '),
    [rocCurve],
  );

  // 正規分布の描画データ
  const xMin = -3;
  const xMax = dPrime + 3;
  const yMax = 0.45;
  const distSteps = 100;

  const negDistPoints = useMemo(() => {
    return Array.from({ length: distSteps + 1 }, (_, i) => {
      const x = xMin + ((xMax - xMin) * i) / distSteps;
      return `${toDistX(x, xMin, xMax)},${toDistY(normalPdf(x, 0, 1), yMax)}`;
    }).join(' ');
  }, [dPrime]);

  const posDistPoints = useMemo(() => {
    return Array.from({ length: distSteps + 1 }, (_, i) => {
      const x = xMin + ((xMax - xMin) * i) / distSteps;
      return `${toDistX(x, xMin, xMax)},${toDistY(normalPdf(x, dPrime, 1), yMax)}`;
    }).join(' ');
  }, [dPrime]);

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        ROC曲線とAUC
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 正規分布図 */}
        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            陰性・陽性の分布とd&apos;
          </div>
          <svg
            viewBox={`0 0 ${DIST_WIDTH} ${DIST_HEIGHT}`}
            className="w-full max-w-sm"
            role="img"
            aria-label="正規分布図"
          >
            {/* 軸 */}
            <line
              x1={DIST_PAD.left} y1={DIST_PAD.top + DIST_PH}
              x2={DIST_PAD.left + DIST_PW} y2={DIST_PAD.top + DIST_PH}
              stroke="currentColor" strokeOpacity={0.3}
            />

            {/* 陰性分布 N(0,1) */}
            <polyline
              points={negDistPoints}
              fill="none" stroke="#3B82F6" strokeWidth={2}
            />
            {/* 陽性分布 N(d',1) */}
            <polyline
              points={posDistPoints}
              fill="none" stroke="#EF4444" strokeWidth={2}
            />

            {/* 閾値線 */}
            <line
              x1={toDistX(threshold, xMin, xMax)}
              y1={DIST_PAD.top}
              x2={toDistX(threshold, xMin, xMax)}
              y2={DIST_PAD.top + DIST_PH}
              stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 2"
            />

            {/* ラベル */}
            <text
              x={DIST_PAD.left + DIST_PW / 4}
              y={DIST_HEIGHT - 4}
              textAnchor="middle"
              className="text-[10px] fill-blue-500"
            >
              陰性 N(0,1)
            </text>
            <text
              x={DIST_PAD.left + (DIST_PW * 3) / 4}
              y={DIST_HEIGHT - 4}
              textAnchor="middle"
              className="text-[10px] fill-red-500"
            >
              {`陽性 N(${dPrime.toFixed(1)},1)`}
            </text>
          </svg>
        </div>

        {/* ROC曲線 */}
        <div>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full max-w-sm"
            role="img"
            aria-label="ROC曲線"
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

            {/* 対角線（ランダム分類器） */}
            <line
              x1={toSvgX(0)} y1={toSvgY(0)}
              x2={toSvgX(1)} y2={toSvgY(1)}
              stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 2"
            />

            {/* ROC曲線 */}
            <polyline
              points={rocPoints}
              fill="none" stroke="#8B5CF6" strokeWidth={2}
            />

            {/* 現在の閾値の点 */}
            <circle cx={toSvgX(fpr)} cy={toSvgY(tpr)} r={5} fill="#F59E0B" />

            {/* 軸ラベル */}
            <text
              x={PADDING.left + PLOT_W / 2}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="text-xs fill-gray-500 dark:fill-gray-400"
            >
              FPR (偽陽性率)
            </text>
            <text
              x={12}
              y={PADDING.top + PLOT_H / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
              className="text-xs fill-gray-500 dark:fill-gray-400"
            >
              TPR (真陽性率)
            </text>
          </svg>
        </div>
      </div>

      {/* d'解説ボックス */}
      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm text-gray-700 dark:text-gray-300">
        <strong>d&apos;（ディープライム）</strong> = 2つの分布間の距離。d&apos;が大きいほど陽性と陰性の分離が良く、分類性能が高い。d&apos;=0はランダム分類器に相当。
      </div>

      {/* スライダー群 */}
      <div className="space-y-2">
        <ErrorCurveSlider
          label={`閾値: ${threshold.toFixed(2)}`}
          value={threshold}
          onChange={setThreshold}
          min={-3}
          max={dPrime + 3}
          step={0.05}
        />
        <ErrorCurveSlider
          label={`d': ${dPrime.toFixed(1)}`}
          value={dPrime}
          onChange={setDPrime}
          min={0}
          max={4}
          step={0.1}
        />
      </div>

      {/* 指標表示 */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-xs text-gray-500">FPR</div>
          <div className="font-mono font-bold">{fpr.toFixed(3)}</div>
        </div>
        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="text-xs text-gray-500">TPR</div>
          <div className="font-mono font-bold">{tpr.toFixed(3)}</div>
        </div>
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-xs text-gray-500">AUC</div>
          <div className="font-mono font-bold">{auc.toFixed(3)}</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        AUC (Area Under the Curve) はROC曲線の下の面積。ランダム分類器で0.5、完全分類器で1.0。
      </p>
    </section>
  );
}
