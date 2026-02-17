'use client';

import { useState } from 'react';
import { getFormulaTabs } from '@/lib/visual-explanations/formula-data';
import { FormulaTab } from './FormulaTab';

/** セクション2: Bias²/Variance/Noise タブ切替 */
export function FormulaDecomposition() {
  const tabs = getFormulaTabs();
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        数式で理解する
      </h3>

      {/* タブ切替 */}
      <div role="tablist" className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeId}
            onClick={() => setActiveId(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              tab.id === activeId
                ? 'bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div role="tabpanel">
        <FormulaTab tab={activeTab} />
      </div>
    </section>
  );
}
