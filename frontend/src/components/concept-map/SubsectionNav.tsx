import type { GlossarySubsection } from '@/types/glossary';

interface SubsectionNavProps {
  subsections: GlossarySubsection[];
  termCounts: Record<string, number>;
  onSelect: (subsectionId: string) => void;
}

/** サブセクション選択カード一覧 */
export function SubsectionNav({ subsections, termCounts, onSelect }: SubsectionNavProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {subsections.map((ss) => (
        <button
          key={ss.id}
          onClick={() => onSelect(ss.id)}
          className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {ss.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {termCounts[ss.id] ?? 0}用語
          </div>
        </button>
      ))}
    </div>
  );
}
