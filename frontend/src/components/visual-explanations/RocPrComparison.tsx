'use client';

import { useState, useMemo } from 'react';
import {
  computeRocCurve,
  computeAuc,
  computePrCurve,
  computeAp,
} from '@/lib/visual-explanations/roc-pr-curves';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 280;
const HEIGHT = 260;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

function toSvgX(x: number): number {
  return PADDING.left + x * PLOT_W;
}
function toSvgY(y: number): number {
  return PADDING.top + (1 - y) * PLOT_H;
}

/** セクション2: ROC vs PR 横並び比較 */
export function RocPrComparison() {
  const [dPrime, setDPrime] = useState(2.0);
  const [positiveRate, setPositiveRate] = useState(0.5);

  const rocCurve = useMemo(() => computeRocCurve(dPrime), [dPrime]);
  const prCurve = useMemo(
    () => computePrCurve(dPrime, positiveRate),
    [dPrime, positiveRate],
  );
  const auc = useMemo(() => computeAuc(dPrime), [dPrime]);
  const ap = useMemo(
    () => computeAp(dPrime, positiveRate),
    [dPrime, positiveRate],
  );

  const rocPoints = useMemo(
    () => rocCurve.map((p) => `${toSvgX(p.fpr)},${toSvgY(p.tpr)}`).join(' '),
    [rocCurve],
  );
  const prSorted = useMemo(
    () => [...prCurve].sort((a, b) => a.recall - b.recall),
    [prCurve],
  );
  const prPoints = useMemo(
    () => prSorted.map((p) => `${toSvgX(p.recall)},${toSvgY(p.precision)}`).join(' '),
    [prSorted],
  );

  // AP領域の塗りつぶし用ポリゴンポイント
  const prFillPoints = useMemo(() => {
    if (prSorted.length === 0) return '';
    const curveStr = prSorted
      .map((p) => `${toSvgX(p.recall)},${toSvgY(p.precision)}`)
      .join(' ');
    const lastRecall = prSorted[prSorted.length - 1].recall;
    const firstRecall = prSorted[0].recall;
    return `${curveStr} ${toSvgX(lastRecall)},${toSvgY(0)} ${toSvgX(firstRecall)},${toSvgY(0)}`;
  }, [prSorted]);

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        ROC曲線 vs PR曲線の比較
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROC曲線 */}
        <div>
          <div className="text-sm font-bold text-center text-gray-700 dark:text-gray-300 mb-1">
            ROC曲線
          </div>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="ROC曲線比較"
          >
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
            <line
              x1={toSvgX(0)} y1={toSvgY(0)}
              x2={toSvgX(1)} y2={toSvgY(1)}
              stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 2"
            />
            <polyline
              points={rocPoints}
              fill="none" stroke="#8B5CF6" strokeWidth={2}
            />
            <text
              x={PADDING.left + PLOT_W / 2}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              FPR
            </text>
            <text
              x={12}
              y={PADDING.top + PLOT_H / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
              className="text-xs fill-gray-500"
            >
              TPR
            </text>
          </svg>
          <div className="text-center text-sm font-mono">
            AUC = {auc.toFixed(3)}
          </div>
        </div>

        {/* PR曲線 */}
        <div>
          <div className="text-sm font-bold text-center text-gray-700 dark:text-gray-300 mb-1">
            PR曲線
          </div>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="PR曲線比較"
          >
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
            {/* AP領域の塗りつぶし */}
            <polygon
              data-testid="pr-fill"
              points={prFillPoints}
              fill="#10B981"
              fillOpacity={0.15}
              stroke="none"
            />
            <polyline
              points={prPoints}
              fill="none" stroke="#10B981" strokeWidth={2}
            />
            {/* APラベル */}
            <text
              data-testid="pr-ap-label"
              x={PADDING.left + PLOT_W * 0.5}
              y={PADDING.top + PLOT_H * 0.6}
              textAnchor="middle"
              className="text-[10px] fill-emerald-600"
              fontWeight="bold"
            >
              AP = {ap.toFixed(2)}
            </text>
            <text
              x={PADDING.left + PLOT_W / 2}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              Recall
            </text>
            <text
              x={12}
              y={PADDING.top + PLOT_H / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
              className="text-xs fill-gray-500"
            >
              Precision
            </text>
          </svg>
          <div className="text-center text-sm font-mono">
            AP = {ap.toFixed(3)}
          </div>
        </div>
      </div>

      {/* スライダー */}
      <div className="space-y-2">
        <ErrorCurveSlider
          label={`d': ${dPrime.toFixed(1)}`}
          value={dPrime}
          onChange={setDPrime}
          min={0}
          max={4}
          step={0.1}
        />
        <ErrorCurveSlider
          label={`陽性割合: ${(positiveRate * 100).toFixed(0)}%`}
          value={positiveRate}
          onChange={setPositiveRate}
          min={0.01}
          max={0.99}
          step={0.01}
        />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        ROC曲線は陽性割合が変わっても安定。PR曲線は不均衡なデータで大きく変化する。
      </p>
    </section>
  );
}
