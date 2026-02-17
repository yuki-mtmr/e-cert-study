'use client';

import katex from 'katex';
import type { RegressionMetricDef } from '@/lib/visual-explanations/regression-metrics';

interface RegressionFormulaCardProps {
  metric: RegressionMetricDef;
  isRevealed: boolean;
  onToggle: () => void;
}

/** 数式と指標名のフリップカード */
export function RegressionFormulaCard({
  metric,
  isRevealed,
  onToggle,
}: RegressionFormulaCardProps) {
  const formulaHtml = katex.renderToString(metric.formula.latex, {
    throwOnError: false,
    displayMode: true,
  });

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isRevealed
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
      }`}
    >
      {/* 数式（常に表示） */}
      <div
        className="text-lg text-center mb-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: formulaHtml }}
      />

      {isRevealed ? (
        <div className="space-y-1 mt-3 border-t border-blue-200 dark:border-blue-700 pt-3">
          <div className="font-bold text-gray-900 dark:text-gray-100">
            {metric.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {metric.enName}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {metric.description}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {metric.tip}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
          クリックで答えを表示
        </div>
      )}
    </button>
  );
}
