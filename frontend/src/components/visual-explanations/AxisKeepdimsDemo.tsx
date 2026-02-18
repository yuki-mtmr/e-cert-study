'use client';

import { useState } from 'react';
import { computeAxisDemo } from '@/lib/visual-explanations/softmax-cross-entropy';

const demo = computeAxisDemo();

/** Q1: axis/keepdimsグリッド図解 */
export function AxisKeepdimsDemo() {
  const [axis, setAxis] = useState<0 | 1>(1);

  const maxResult = axis === 0 ? demo.maxAxis0 : demo.maxAxis1;
  const keepdimsResult = demo.keepdimsAxis1;
  const shapeLabel = axis === 1 ? '(2, 1)' : '(3,)';
  const shapeFalseLabel = axis === 1 ? '(2,)' : '(3,)';

  return (
    <div data-testid="axis-keepdims-demo" className="space-y-3">
      {/* axis切替ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={axis === 0}
          onClick={() => setAxis(0)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            axis === 0
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          axis=0
        </button>
        <button
          type="button"
          aria-pressed={axis === 1}
          onClick={() => setAxis(1)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            axis === 1
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          axis=1
        </button>
      </div>

      {/* 入力行列グリッド */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 dark:text-gray-400">入力行列 x (2x3)</div>
        <div data-testid="axis-demo-grid" className="inline-grid grid-cols-3 gap-1">
          {demo.original.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-14 h-10 flex items-center justify-center rounded text-sm font-mono border ${
                  axis === 0
                    ? 'border-blue-300 dark:border-blue-600'
                    : 'border-blue-300 dark:border-blue-600'
                } bg-white dark:bg-gray-800`}
              >
                {val.toFixed(1)}
              </div>
            )),
          )}
        </div>

        {/* axis方向矢印 */}
        <div className="text-xs text-blue-600 dark:text-blue-400">
          {axis === 0 ? '↓ axis=0（列方向にmax）' : '→ axis=1（行方向にmax）'}
        </div>
      </div>

      {/* max結果 */}
      <div data-testid="axis-demo-max-result" className="space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          np.max(x, axis={axis}) = [{maxResult.map((v) => v.toFixed(1)).join(', ')}]
        </div>

        {axis === 1 && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">keepdims=False</span>: shape {shapeFalseLabel} →
              [{demo.maxAxis1.map((v) => v.toFixed(1)).join(', ')}]
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">keepdims=True</span>: shape {shapeLabel} →
              [{keepdimsResult.map((row) => `[${row.map((v) => v.toFixed(1)).join(', ')}]`).join(', ')}]
            </div>

            {/* 減算結果 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              x - max(axis=1, keepdims=True):
            </div>
            <div className="inline-grid grid-cols-3 gap-1">
              {demo.subtracted.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`sub-${r}-${c}`}
                    className={`w-14 h-10 flex items-center justify-center rounded text-sm font-mono border ${
                      val === 0
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {val.toFixed(1)}
                  </div>
                )),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
