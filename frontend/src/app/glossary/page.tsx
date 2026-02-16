'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SECTIONS, SUBSECTIONS, TERMS } from '@/data/glossary-terms';
import { filterTerms, groupTermsBySection } from '@/lib/glossary';
import { GlossarySection } from '@/components/GlossarySection';

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);

  const filtered = useMemo(
    () => filterTerms(TERMS, query, selectedSectionId),
    [query, selectedSectionId]
  );

  const grouped = useMemo(
    () => groupTermsBySection(filtered, SECTIONS, SUBSECTIONS),
    [filtered]
  );

  const hasActiveFilter = query.length > 0 || selectedSectionId !== undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← ホーム
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            E資格 用語集
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 検索 */}
        <input
          type="text"
          placeholder="用語を検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* セクションフィルタ */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSectionId(undefined)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSectionId === undefined
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            全て
          </button>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() =>
                setSelectedSectionId(
                  selectedSectionId === section.id ? undefined : section.id
                )
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSectionId === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {section.emoji} {section.name}
            </button>
          ))}
        </div>

        {/* 用語数 */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          全 {filtered.length} 用語
        </p>

        {/* セクション一覧 */}
        <div className="space-y-3">
          {grouped.map((group) => (
            <GlossarySection
              key={group.section.id}
              group={group}
              defaultOpen={hasActiveFilter}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            該当する用語が見つかりません
          </p>
        )}
      </main>
    </div>
  );
}
