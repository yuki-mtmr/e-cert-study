'use client';

import {
  getValidationSummary,
  getComparisonRows,
} from '@/lib/visual-explanations/validation-comparison';

/** ホールドアウト vs k-分割交差検証 比較ビジュアル */
export function ValidationComparison() {
  const summaries = getValidationSummary();
  const rows = getComparisonRows();

  return (
    <div className="space-y-6">
      {/* 一言で */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          一言で
        </h3>
        <div className="space-y-2">
          {summaries.map((bullet) => (
            <div
              key={bullet.method}
              data-testid="summary-bullet"
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="font-bold text-gray-900 dark:text-gray-100 shrink-0">
                {bullet.method}
              </span>
              <span>→ {bullet.summary}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 比較表 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          比較表
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                  カテゴリ
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                  ホールドアウト
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                  k-分割交差検証
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.category}
                  data-testid="comparison-row"
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">
                    {row.category}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                    {row.holdout}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                    {row.kFold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
