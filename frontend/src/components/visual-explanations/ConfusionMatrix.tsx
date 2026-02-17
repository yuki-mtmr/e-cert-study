'use client';

import { Fragment } from 'react';
import {
  getConfusionMatrixSummary,
  getMatrixCells,
  getMetricFormulas,
} from '@/lib/visual-explanations/confusion-matrix';

/** 混同行列ビジュアル解説 */
export function ConfusionMatrix() {
  const summary = getConfusionMatrixSummary();
  const { headers, cells } = getMatrixCells();
  const formulas = getMetricFormulas();

  return (
    <div className="space-y-6">
      {/* 一言で */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          一言で
        </h3>
        <p
          data-testid="cm-summary"
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {summary}
        </p>
      </section>

      {/* 混同行列 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          混同行列
        </h3>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {/* 角の空セル */}
          <div />
          {/* 列ヘッダー */}
          {headers.col.map((col) => (
            <div
              key={col}
              className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 py-1"
            >
              {col}
            </div>
          ))}
          {/* 行ごと: 行ヘッダー + データセル */}
          {cells.map((row, rowIdx) => (
            <Fragment key={headers.row[rowIdx]}>
              <div
                className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300 pr-2"
              >
                {headers.row[rowIdx]}
              </div>
              {row.map((cell) => (
                <div
                  key={cell.id}
                  data-testid={`matrix-cell-${cell.id}`}
                  className={`${cell.colorClass} rounded-lg p-3 text-center`}
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {cell.abbreviation}
                  </div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {cell.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {cell.description}
                  </div>
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </section>

      {/* 導出される指標 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          導出される指標
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formulas.map((f) => (
            <div
              key={f.enName}
              data-testid="metric-formula"
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {f.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {f.enName}
                </span>
              </div>
              <code className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded block">
                {f.formula}
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
