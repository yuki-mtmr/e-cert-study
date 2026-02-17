'use client';

import type { VisualizationMeta } from '@/lib/visual-explanations/registry';

interface VisualizationContainerProps {
  visualizations: VisualizationMeta[];
}

/** ビジュアル解説カードのラッパー（タイトル+説明+コンポーネント描画） */
export function VisualizationContainer({ visualizations }: VisualizationContainerProps) {
  return (
    <div className="space-y-6">
      {visualizations.map((viz) => {
        const Comp = viz.component;
        return (
          <div
            key={viz.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
              {viz.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {viz.description}
            </p>
            <Comp />
          </div>
        );
      })}
    </div>
  );
}
