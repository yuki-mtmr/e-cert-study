'use client';

import { useState } from 'react';
import {
  getConfusionMatrixSummary,
  getMetricFormulasV2,
} from '@/lib/visual-explanations/confusion-matrix';
import type { HighlightGroup } from '@/lib/visual-explanations/confusion-matrix';
import { ConfusionMatrixGrid } from '@/components/visual-explanations/ConfusionMatrixGrid';
import { MetricCard } from '@/components/visual-explanations/MetricCard';

/** 混同行列ビジュアル解説（リデザイン版） */
export function ConfusionMatrix() {
  const summary = getConfusionMatrixSummary();
  const formulas = getMetricFormulasV2();
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const selectedMetric = formulas.find((f) => f.id === selectedMetricId);
  const highlight: HighlightGroup | null = selectedMetric?.highlight ?? null;

  const handleMetricClick = (metricId: string) => {
    setSelectedMetricId((prev) => (prev === metricId ? null : metricId));
  };

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
        <ConfusionMatrixGrid highlight={highlight} />
      </section>

      {/* 導出される指標 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          導出される指標
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formulas.map((f) => (
            <MetricCard
              key={f.id}
              metric={f}
              isSelected={selectedMetricId === f.id}
              onClick={() => handleMetricClick(f.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
