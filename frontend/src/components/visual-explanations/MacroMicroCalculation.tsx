'use client';

import type { ClassMetrics, AverageResult } from '@/lib/visual-explanations/micro-macro-average';
import { computeMacroAverage, computeMicroAverage } from '@/lib/visual-explanations/micro-macro-average';

interface MacroMicroCalculationProps {
  metrics: ClassMetrics[];
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-mono font-bold">{value.toFixed(4)}</span>
    </div>
  );
}

function AverageBlock({
  title,
  color,
  result,
}: {
  title: string;
  color: string;
  result: AverageResult;
}) {
  return (
    <div className={`p-3 rounded-lg border ${color} space-y-2`}>
      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</div>
      <MetricRow label="Precision" value={result.precision} />
      <MetricRow label="Recall" value={result.recall} />
      <MetricRow label="F1" value={result.f1} />
    </div>
  );
}

/** マクロ/マイクロ平均の計算過程を横並びで表示 */
export function MacroMicroCalculation({ metrics }: MacroMicroCalculationProps) {
  const macro = computeMacroAverage(metrics);
  const micro = computeMicroAverage(metrics);

  return (
    <div className="space-y-4">
      {/* 各クラスの指標 */}
      <div className="space-y-2">
        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
          クラス別指標
        </div>
        <div className="grid grid-cols-3 gap-2">
          {metrics.map((m) => (
            <div
              key={m.className}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1"
            >
              <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
                {m.className}
              </div>
              <MetricRow label="Precision" value={m.precision} />
              <MetricRow label="Recall" value={m.recall} />
              <MetricRow label="F1" value={m.f1} />
            </div>
          ))}
        </div>
      </div>

      {/* マクロ vs マイクロ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AverageBlock
          title="マクロ平均（各クラスの単純平均）"
          color="border-blue-300 dark:border-blue-700"
          result={macro}
        />
        <AverageBlock
          title="マイクロ平均（全体TP/FP/FNを合算）"
          color="border-green-300 dark:border-green-700"
          result={micro}
        />
      </div>
    </div>
  );
}
