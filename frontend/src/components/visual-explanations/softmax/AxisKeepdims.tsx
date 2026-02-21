'use client';

import { useState, useMemo } from 'react';
import { computeAxisDemo } from '@/lib/visual-explanations/softmax-cross-entropy';
import { MatrixGrid, Cell, KeyPoint } from './shared';

type Axis = 0 | 1;

export function AxisKeepdims() {
  const [axis, setAxis] = useState<Axis>(1);
  const demo = useMemo(() => computeAxisDemo(), []);

  const maxResult = axis === 0 ? demo.maxAxis0 : demo.maxAxis1;
  const maxShape = axis === 0 ? `(${demo.original[0].length},)` : `(${demo.original.length},)`;
  const keepdimsShape =
    axis === 0
      ? `(1, ${demo.original[0].length})`
      : `(${demo.original.length}, 1)`;

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. axis/keepdimsの行列操作</h3>

      {/* トグルボタン */}
      <div className="flex gap-2">
        {([0, 1] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={axis === a}
            onClick={() => setAxis(a)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              axis === a
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            axis={a}{a === 0 ? '（列↓）' : '（行→）'}
          </button>
        ))}
      </div>

      {/* 元の行列 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          元の行列 ({demo.original.length}×{demo.original[0].length})
        </div>
        <MatrixGrid data={demo.original} />
      </div>

      {/* max結果 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          np.max(x, axis={axis}) → 形状 {maxShape}
        </div>
        <div className="flex gap-1">
          {maxResult.map((v, i) => (
            <Cell key={i} value={v} highlight />
          ))}
        </div>
      </div>

      {/* keepdims */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          keepdims=True → 形状 {keepdimsShape}
        </div>
        {axis === 1 && <MatrixGrid data={demo.keepdimsAxis1} highlight />}
      </div>

      {/* ブロードキャスト引き算結果 */}
      {axis === 1 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">x - max(axis=1, keepdims=True)</div>
          <MatrixGrid data={demo.subtracted} />
        </div>
      )}

      {/* 要点ボックス */}
      <KeyPoint text="axis=1, keepdims=True → 形状保持でブロードキャスト可能" />
    </section>
  );
}
