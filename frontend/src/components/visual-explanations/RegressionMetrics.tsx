'use client';

import { useState } from 'react';
import { getRegressionMetrics } from '@/lib/visual-explanations/regression-metrics';
import type { RegressionMetricId } from '@/lib/visual-explanations/regression-metrics';
import { RegressionFormulaCard } from './RegressionFormulaCard';
import { ResidualPlot } from './ResidualPlot';
import { UsageGuideTable } from './UsageGuideTable';

/** 回帰指標ビジュアル解説（3セクション構成） */
export function RegressionMetrics() {
  const metrics = getRegressionMetrics();
  const [revealedIds, setRevealedIds] = useState<Set<RegressionMetricId>>(
    new Set(),
  );

  const toggleCard = (id: RegressionMetricId) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const revealAll = () => {
    setRevealedIds(new Set(metrics.map((m) => m.id)));
  };

  const resetAll = () => {
    setRevealedIds(new Set());
  };

  return (
    <div className="space-y-8">
      {/* セクション1: 数式クイズ */}
      <section>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          数式クイズ
        </h3>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={revealAll}
            className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            全て表示
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="px-3 py-1 rounded text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            リセット
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <RegressionFormulaCard
              key={m.id}
              metric={m}
              isRevealed={revealedIds.has(m.id)}
              onToggle={() => toggleCard(m.id)}
            />
          ))}
        </div>
      </section>

      {/* セクション2: 残差ビジュアライゼーション */}
      <section>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          残差ビジュアライゼーション
        </h3>
        <ResidualPlot />
      </section>

      {/* セクション3: 使い分けガイド */}
      <section>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
          使い分けガイド
        </h3>
        <UsageGuideTable />
      </section>
    </div>
  );
}
