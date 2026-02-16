'use client';

import type { GlossaryViewMode } from '@/types/concept-map';

interface ViewToggleProps {
  viewMode: GlossaryViewMode;
  onChange: (mode: GlossaryViewMode) => void;
}

const TABS: { mode: GlossaryViewMode; label: string }[] = [
  { mode: 'list', label: 'リスト' },
  { mode: 'map', label: 'マップ' },
];

/**
 * リスト/マップ切替のセグメントコントロール
 */
export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.mode}
          role="tab"
          aria-selected={viewMode === tab.mode}
          onClick={() => onChange(tab.mode)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
            viewMode === tab.mode
              ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
