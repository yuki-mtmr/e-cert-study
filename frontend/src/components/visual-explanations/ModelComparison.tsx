'use client';

import { useState, useMemo } from 'react';
import { computeRocCurve, computeAuc } from '@/lib/visual-explanations/roc-pr-curves';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 350;
const HEIGHT = 320;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

function toSvgX(x: number): number {
  return PADDING.left + x * PLOT_W;
}
function toSvgY(y: number): number {
  return PADDING.top + (1 - y) * PLOT_H;
}

interface ModelDef {
  name: string;
  baseDPrime: number;
  color: string;
}

const MODELS: ModelDef[] = [
  { name: 'モデルA', baseDPrime: 1.0, color: '#3B82F6' },
  { name: 'モデルB', baseDPrime: 2.0, color: '#10B981' },
  { name: 'モデルC', baseDPrime: 3.0, color: '#EF4444' },
];

/** セクション4: 複数モデルROC比較 */
export function ModelComparison() {
  const [scale, setScale] = useState(1.0);

  const modelsData = useMemo(
    () =>
      MODELS.map((m) => {
        const d = m.baseDPrime * scale;
        const curve = computeRocCurve(d);
        const auc = computeAuc(d);
        const points = curve
          .map((p) => `${toSvgX(p.fpr)},${toSvgY(p.tpr)}`)
          .join(' ');
        return { ...m, dPrime: d, curve, auc, points };
      }),
    [scale],
  );

  // 対角線
  const diagonalPoints = `${toSvgX(0)},${toSvgY(0)} ${toSvgX(1)},${toSvgY(1)}`;

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        モデル比較
      </h3>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-md"
        role="img"
        aria-label="モデル比較ROC曲線"
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

        {/* 対角線 */}
        <polyline
          points={diagonalPoints}
          fill="none" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 2"
        />

        {/* 各モデルROC曲線 */}
        {modelsData.map((m) => (
          <polyline
            key={m.name}
            points={m.points}
            fill="none"
            stroke={m.color}
            strokeWidth={2}
          />
        ))}

        {/* 軸ラベル */}
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

      {/* 凡例 + AUC */}
      <div className="flex flex-wrap gap-4 text-sm">
        {modelsData.map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{ backgroundColor: m.color }} />
            <span className="text-gray-700 dark:text-gray-300">
              {m.name} (AUC={m.auc.toFixed(3)})
            </span>
          </div>
        ))}
      </div>

      {/* スライダー */}
      <ErrorCurveSlider
        label={`d'スケール: ${scale.toFixed(1)}x`}
        value={scale}
        onChange={setScale}
        min={0.1}
        max={2.0}
        step={0.1}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        ROC曲線が左上に近いほど優れた分類器。AUCで定量比較できる。
      </p>
    </section>
  );
}
