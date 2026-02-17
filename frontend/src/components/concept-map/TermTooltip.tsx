import type { TermExamPoints } from '@/types/glossary';

interface TermTooltipProps {
  jaName: string;
  examPoints: TermExamPoints;
  x: number;
  y: number;
  onClose?: () => void;
}

/** 用語ノードの試験ポイントツールチップ */
export function TermTooltip({ jaName, examPoints, x, y, onClose }: TermTooltipProps) {
  return (
    <div
      className="absolute z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {jaName}
        </h4>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {examPoints.formula && (
        <div
          data-testid="tooltip-formula"
          className="mb-2 rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        >
          {examPoints.formula}
        </div>
      )}

      <ul className="space-y-1">
        {examPoints.points.map((point) => (
          <li
            key={point}
            className="text-xs leading-relaxed text-gray-600 dark:text-gray-400"
          >
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
