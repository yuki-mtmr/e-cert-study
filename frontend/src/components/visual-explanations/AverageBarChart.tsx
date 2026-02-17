'use client';

import type { AverageResult } from '@/lib/visual-explanations/micro-macro-average';

const WIDTH = 350;
const HEIGHT = 200;
const PAD = { top: 20, right: 20, bottom: 40, left: 80 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

const METRICS = ['Precision', 'Recall', 'F1'] as const;
const MACRO_COLOR = '#3B82F6';
const MICRO_COLOR = '#10B981';

interface AverageBarChartProps {
  macro: AverageResult;
  micro: AverageResult;
}

/** マクロ/マイクロ比較のSVGバーチャート */
export function AverageBarChart({ macro, micro }: AverageBarChartProps) {
  const barHeight = PLOT_H / METRICS.length / 3;
  const gap = barHeight * 0.3;

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-md"
        role="img"
        aria-label="マクロ平均とマイクロ平均の比較"
      >
        {/* 軸 */}
        <line
          x1={PAD.left} y1={PAD.top}
          x2={PAD.left} y2={PAD.top + PLOT_H}
          stroke="currentColor" strokeOpacity={0.3}
        />

        {METRICS.map((metric, i) => {
          const metricKey = metric.toLowerCase() as keyof AverageResult;
          const macroVal = macro[metricKey];
          const microVal = micro[metricKey];
          const groupY = PAD.top + (PLOT_H * i) / METRICS.length;

          return (
            <g key={metric}>
              {/* ラベル */}
              <text
                x={PAD.left - 5}
                y={groupY + barHeight + gap / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {metric}
              </text>
              {/* マクロバー */}
              <rect
                data-testid={`bar-macro-${metric}`}
                x={PAD.left}
                y={groupY}
                width={Math.max(0, macroVal * PLOT_W)}
                height={barHeight}
                fill={MACRO_COLOR}
                rx={2}
              />
              {/* マイクロバー */}
              <rect
                data-testid={`bar-micro-${metric}`}
                x={PAD.left}
                y={groupY + barHeight + gap}
                width={Math.max(0, microVal * PLOT_W)}
                height={barHeight}
                fill={MICRO_COLOR}
                rx={2}
              />
            </g>
          );
        })}
      </svg>

      {/* 凡例 */}
      <div className="flex gap-4 text-xs justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: MACRO_COLOR }} />
          <span className="text-gray-600 dark:text-gray-400">マクロ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: MICRO_COLOR }} />
          <span className="text-gray-600 dark:text-gray-400">マイクロ</span>
        </div>
      </div>
    </div>
  );
}
