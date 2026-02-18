'use client';

import { MatrixShapeBlock } from './exam-hints/MatrixShapeBlock';
import { ExamQ6AffineLayer } from './ExamQ6AffineLayer';

// 色定数: 行次元=blue, 列次元=emerald, 内側次元(一致)=amber
const C = {
  N: '#3B82F6',   // blue
  D: '#F59E0B',   // amber（内側一致次元）
  M: '#10B981',   // emerald
};

// --- セクション1: Forward行列形状ブロック図 ---

function ForwardShapes() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. 行列形状ブロック図 — Forward</h3>

      <div className="flex items-center gap-3 flex-wrap text-sm">
        <MatrixShapeBlock label="X" rows="N" cols="D" rowColor={C.N} colColor={C.D} />
        <span className="text-lg text-gray-400">×</span>
        <MatrixShapeBlock label="W" rows="D" cols="M" rowColor={C.D} colColor={C.M} />
        <span className="text-lg text-gray-400">+</span>
        <span className="font-mono text-sm" style={{ color: C.M }}>b[M]</span>
        <span className="text-lg text-gray-400">=</span>
        <MatrixShapeBlock label="Out" rows="N" cols="M" rowColor={C.N} colColor={C.M} />
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400">
        内側次元（<span className="font-bold" style={{ color: C.D }}>D</span>）が一致するから行列積が計算できる
      </div>
    </section>
  );
}

// --- セクション2: Backward 3つの行列形状ブロック図 ---

function BackwardShapes() {
  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold">2. 行列形状ブロック図 — Backward</h3>

      {/* dx */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">
          dx = np.dot(dout, W.T)
        </div>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <MatrixShapeBlock label="dout" rows="N" cols="M" rowColor={C.N} colColor={C.M} />
          <span className="text-lg text-gray-400">×</span>
          <MatrixShapeBlock label="W" rows="M" cols="D" rowColor={C.M} colColor={C.D} superscript="T" />
          <span className="text-lg text-gray-400">=</span>
          <MatrixShapeBlock label="dx" rows="N" cols="D" rowColor={C.N} colColor={C.D} />
        </div>
      </div>

      {/* dW */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">
          dW = np.dot(x.T, dout)
        </div>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <MatrixShapeBlock label="X" rows="D" cols="N" rowColor={C.D} colColor={C.N} superscript="T" />
          <span className="text-lg text-gray-400">×</span>
          <MatrixShapeBlock label="dout" rows="N" cols="M" rowColor={C.N} colColor={C.M} />
          <span className="text-lg text-gray-400">=</span>
          <MatrixShapeBlock label="dW" rows="D" cols="M" rowColor={C.D} colColor={C.M} />
        </div>
      </div>

      {/* db */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">
          db = np.sum(dout, axis=0)
        </div>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <MatrixShapeBlock label="dout" rows="N" cols="M" rowColor={C.N} colColor={C.M} />
          <span className="text-lg text-gray-400">→ バッチ集約 →</span>
          <span className="font-mono text-sm" style={{ color: C.M }}>db[M]</span>
        </div>
      </div>
    </section>
  );
}

// --- セクション3: Forward/Backward対応の全体まとめ表 ---

const SUMMARY_ROWS = [
  {
    variable: 'out',
    formula: 'np.dot(x, W) + b',
    left: 'X (N,D)',
    right: 'W (D,M)',
    result: '(N,M)',
    point: 'forward順方向',
  },
  {
    variable: 'dx',
    formula: 'np.dot(dout, W.T)',
    left: 'dout (N,M)',
    right: 'W^T (M,D)',
    result: '(N,D)',
    point: 'Wを転置して逆方向',
  },
  {
    variable: 'dW',
    formula: 'np.dot(x.T, dout)',
    left: 'X^T (D,N)',
    right: 'dout (N,M)',
    result: '(D,M)',
    point: 'xを転置',
  },
  {
    variable: 'db',
    formula: 'np.sum(dout, axis=0)',
    left: 'dout (N,M)',
    right: '—',
    result: '(M,)',
    point: 'バッチ方向に合計',
  },
];

function SummaryTable() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">3. Forward/Backward全体まとめ</h3>

      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">変数</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">式</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">左</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">右</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">結果</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">ポイント</th>
            </tr>
          </thead>
          <tbody>
            {SUMMARY_ROWS.map((row) => (
              <tr
                key={row.variable}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.variable}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {row.formula}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.left}</td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.right}</td>
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.result}
                </td>
                <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                  {row.point}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
        形状を見れば転置の有無と引数の順序がわかる
      </div>
    </section>
  );
}

// --- 親コンポーネント ---

/** Affineレイヤーの背景知識をビジュアルで整理する解説コンポーネント */
export function AffineLayerExplanation() {
  return (
    <div className="space-y-8">
      <ForwardShapes />
      <BackwardShapes />
      <SummaryTable />

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <details>
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            4択問題で確認する
          </summary>
          <div className="mt-3">
            <ExamQ6AffineLayer />
          </div>
        </details>
      </div>
    </div>
  );
}
