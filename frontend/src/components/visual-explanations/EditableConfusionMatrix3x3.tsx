'use client';

import type { ConfusionMatrix3x3 } from '@/lib/visual-explanations/micro-macro-average';

const CLASS_LABELS = ['犬', '猫', '鳥'];
const DIAGONAL_BG = 'bg-green-50 dark:bg-green-900/20';
const OFF_DIAGONAL_BG = 'bg-red-50 dark:bg-red-900/10';

interface EditableConfusionMatrix3x3Props {
  matrix: ConfusionMatrix3x3;
  onChange: (matrix: ConfusionMatrix3x3) => void;
}

/** 編集可能な3×3混同行列 */
export function EditableConfusionMatrix3x3({
  matrix,
  onChange,
}: EditableConfusionMatrix3x3Props) {
  const handleChange = (row: number, col: number, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    const newMatrix = matrix.map((r) => [...r]);
    newMatrix[row][col] = num;
    onChange(newMatrix);
  };

  // 行合計・列合計を計算
  const rowSums = matrix.map((row) => row.reduce((s, v) => s + v, 0));
  const colSums = matrix[0].map((_, colIdx) =>
    matrix.reduce((s, row) => s + row[colIdx], 0),
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        行が実際のクラス、列が予測したクラス。対角線（緑）が正解数。
      </p>
      <table className="border-collapse text-center text-sm">
        <thead>
          <tr>
            <th className="p-1 text-xs text-gray-500">実際＼予測</th>
            {CLASS_LABELS.map((label) => (
              <th
                key={label}
                className="p-1 text-xs text-gray-600 dark:text-gray-400 font-medium"
              >
                {label}
              </th>
            ))}
            <th className="p-1 text-xs text-gray-500">合計</th>
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td className="p-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
                {CLASS_LABELS[rowIdx]}
              </td>
              {row.map((val, colIdx) => {
                const isDiagonal = rowIdx === colIdx;
                return (
                  <td
                    key={colIdx}
                    className={`p-1 ${isDiagonal ? DIAGONAL_BG : OFF_DIAGONAL_BG}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-gray-400">
                        {isDiagonal ? '正解' : '誤分類'}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={val}
                        onChange={(e) => handleChange(rowIdx, colIdx, e.target.value)}
                        className="w-14 text-center p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm font-mono"
                      />
                    </div>
                  </td>
                );
              })}
              <td className="p-1 text-xs font-mono text-gray-500">{rowSums[rowIdx]}</td>
            </tr>
          ))}
          {/* 列合計行 */}
          <tr>
            <td className="p-1 text-xs text-gray-500">合計</td>
            {colSums.map((sum, i) => (
              <td key={i} className="p-1 text-xs font-mono text-gray-500">{sum}</td>
            ))}
            <td className="p-1 text-xs font-mono text-gray-400">
              {rowSums.reduce((s, v) => s + v, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
