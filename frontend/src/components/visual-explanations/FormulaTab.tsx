'use client';

import katex from 'katex';
import type { FormulaTabData } from '@/lib/visual-explanations/formula-data';

interface FormulaTabProps {
  tab: FormulaTabData;
}

/** 単一タブ: KaTeX数式 + 色分けパーツ + ツールチップ + 要約 */
export function FormulaTab({ tab }: FormulaTabProps) {
  const formulaHtml = katex.renderToString(tab.fullFormula, {
    throwOnError: false,
    displayMode: true,
  });

  return (
    <div className="space-y-4">
      {/* メイン数式 */}
      <div
        className="text-center overflow-x-auto py-2"
        dangerouslySetInnerHTML={{ __html: formulaHtml }}
      />

      {/* 色分けパーツ */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tab.parts.map((part) => (
          <span
            key={part.id}
            title={part.tooltip}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-help border border-gray-200 dark:border-gray-600"
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: part.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {part.label}
            </span>
          </span>
        ))}
      </div>

      {/* 要約 */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-700 dark:text-gray-300">
        <div className="font-medium mb-1">意味:</div>
        {tab.summary}
      </div>

      {/* 射撃アナロジー対応 */}
      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-sm text-gray-700 dark:text-gray-300">
        <div className="font-medium mb-1">射撃でいうと:</div>
        {tab.analogyText}
      </div>
    </div>
  );
}
