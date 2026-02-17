'use client';

import {
  getUsageGuide,
  getMetricCharacteristics,
} from '@/lib/visual-explanations/regression-metrics';

/** セクション3: 使い分けガイド（2テーブル） */
export function UsageGuideTable() {
  const guide = getUsageGuide();
  const characteristics = getMetricCharacteristics();

  return (
    <div className="space-y-6">
      {/* テーブル1: 何がしたい時はこれ */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          何がしたい時はこれ
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  目的
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  推奨指標
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  理由
                </th>
              </tr>
            </thead>
            <tbody>
              {guide.map((row) => (
                <tr key={row.metricId}>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {row.goal}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700 font-mono font-bold">
                    {row.metricName}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {row.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* テーブル2: 特性比較 */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          特性比較
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  指標
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  範囲
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  単位
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  外れ値感度
                </th>
                <th className="text-left p-2 border border-gray-200 dark:border-gray-700">
                  キーポイント
                </th>
              </tr>
            </thead>
            <tbody>
              {characteristics.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border border-gray-200 dark:border-gray-700 font-mono font-bold">
                    {c.name}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {c.range}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {c.unit}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {c.outlierSensitivityLabel}
                  </td>
                  <td className="p-2 border border-gray-200 dark:border-gray-700">
                    {c.keyPoint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
