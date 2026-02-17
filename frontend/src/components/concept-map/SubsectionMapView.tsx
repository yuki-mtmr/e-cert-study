'use client';

import { useMemo } from 'react';
import type { GlossaryTerm, TermExamPoints } from '@/types/glossary';
import { getRelationsForSubsection } from '@/data/glossary/term-relations';
import { getExamPoints } from '@/data/glossary/exam-points';
import { computeLayout } from '@/lib/concept-map-layout';
import { SubsectionMap } from './SubsectionMap';

interface SubsectionMapViewProps {
  subsectionId: string;
  subsectionName: string;
  terms: GlossaryTerm[];
  onBack: () => void;
}

const LEGEND_ITEMS = [
  { type: 'prerequisite', color: '#94a3b8', label: '前提知識' },
  { type: 'variant', color: '#3b82f6', label: '派生' },
  { type: 'component', color: '#22c55e', label: '構成要素' },
  { type: 'applies', color: '#f59e0b', label: '適用' },
] as const;

/** サブセクションドリルダウン表示（レイアウト計算 + マップ描画） */
export function SubsectionMapView({
  subsectionId,
  subsectionName,
  terms,
  onBack,
}: SubsectionMapViewProps) {
  const layout = useMemo(() => {
    const relData = getRelationsForSubsection(subsectionId);
    const termIds = terms.map((t) => t.id);
    return computeLayout(termIds, relData?.relations ?? []);
  }, [subsectionId, terms]);

  const examPoints: TermExamPoints[] = useMemo(
    () => terms
      .map((t) => getExamPoints(t.id))
      .filter((ep): ep is TermExamPoints => ep !== undefined),
    [terms],
  );

  return (
    <div className="space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="戻る"
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          ← 戻る
        </button>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {subsectionName}
        </h3>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-xs">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* マップ */}
      <div className="overflow-x-auto">
        <SubsectionMap layout={layout} terms={terms} examPoints={examPoints} />
      </div>
    </div>
  );
}
