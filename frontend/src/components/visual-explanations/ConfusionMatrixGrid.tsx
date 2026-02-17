import { Fragment } from 'react';
import { getMatrixCells } from '@/lib/visual-explanations/confusion-matrix';
import type { CellId, HighlightGroup } from '@/lib/visual-explanations/confusion-matrix';

interface ConfusionMatrixGridProps {
  highlight: HighlightGroup | null;
}

/** セルのハイライト状態に応じたクラスを返す */
function getCellHighlightClass(cellId: CellId, highlight: HighlightGroup | null): string {
  if (!highlight) return '';

  if (highlight.numeratorCells.includes(cellId)) {
    return 'ring-2 ring-indigo-500 scale-105';
  }
  if (highlight.denominatorOnlyCells.includes(cellId)) {
    return 'opacity-70';
  }
  return 'opacity-20';
}

/** 2x2 混同行列グリッド（ハイライト対応） */
export function ConfusionMatrixGrid({ highlight }: ConfusionMatrixGridProps) {
  const { headers, cells } = getMatrixCells();

  return (
    <div className="grid grid-cols-3 gap-2 max-w-md">
      {/* 角の空セル */}
      <div />
      {/* 列ヘッダー */}
      {headers.col.map((col) => (
        <div
          key={col}
          className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 py-1"
        >
          {col}
        </div>
      ))}
      {/* 行ごと: 行ヘッダー + データセル */}
      {cells.map((row, rowIdx) => (
        <Fragment key={headers.row[rowIdx]}>
          <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300 pr-2">
            {headers.row[rowIdx]}
          </div>
          {row.map((cell) => (
            <div
              key={cell.id}
              data-testid={`matrix-cell-${cell.id}`}
              className={`${cell.colorClass} rounded-lg p-3 text-center transition-all ${getCellHighlightClass(cell.id, highlight)}`}
            >
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {cell.abbreviation}
              </div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {cell.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {cell.description}
              </div>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
