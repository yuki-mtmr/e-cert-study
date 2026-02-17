'use client';

import type { ConfusionMatrix3x3 } from '@/lib/visual-explanations/micro-macro-average';

const CLASS_LABELS = ['クラスA', 'クラスB', 'クラスC'];
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

  return (
    <div className="space-y-2">
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
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td className="p-1 text-xs text-gray-600 dark:text-gray-400 font-medium">
                {CLASS_LABELS[rowIdx]}
              </td>
              {row.map((val, colIdx) => (
                <td
                  key={colIdx}
                  className={`p-1 ${rowIdx === colIdx ? DIAGONAL_BG : OFF_DIAGONAL_BG}`}
                >
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => handleChange(rowIdx, colIdx, e.target.value)}
                    className="w-14 text-center p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent text-sm font-mono"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
