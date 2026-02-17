'use client';

export type TabType = 'map' | 'visual';

interface SubsectionTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { value: TabType; label: string }[] = [
  { value: 'map', label: '用語マップ' },
  { value: 'visual', label: 'ビジュアル解説' },
];

/** 用語マップ / ビジュアル解説 の切替タブ */
export function SubsectionTabs({ activeTab, onTabChange }: SubsectionTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.value
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
