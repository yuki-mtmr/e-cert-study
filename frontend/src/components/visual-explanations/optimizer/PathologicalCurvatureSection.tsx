'use client';

import {
  OPTIMIZER_COLORS,
  generateSgdPath,
  generateMomentumPath,
  toPolylinePoints,
} from '@/lib/visual-explanations/optimizer-momentum';

const PC_ANALYSIS_ROWS = [
  {
    label: 'A',
    text: 'SGDでは谷の壁に沿って振動が起き、収束が遅くなる',
    correct: true,
    reason: '正しい。PCの典型的な症状',
  },
  {
    label: 'B',
    text: 'SGDは局所最小値に陥りやすい問題である',
    correct: false,
    reason: '不適切。PCは振動の問題であり局所最小値とは無関係',
  },
  {
    label: 'C',
    text: 'Momentumは慣性により振動を抑制し、収束を加速する',
    correct: true,
    reason: '正しい。Momentumの主要な利点',
  },
  {
    label: 'D',
    text: '損失関数の等高線が細長い楕円状になる現象',
    correct: true,
    reason: '正しい。PCの定義そのもの',
  },
];

export function PathologicalCurvatureSection() {
  const sgdPath = generateSgdPath(15);
  const momentumPath = generateMomentumPath(15, 0.9);

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">3. Pathological Curvature</h3>

      {/* SVG軌跡図 */}
      <div className="flex justify-center">
        <svg viewBox="0 0 260 120" className="w-full max-w-md" role="img">
          <title>SGD vs Momentum 軌跡比較</title>
          {/* 等高線（細長い楕円谷） */}
          <ellipse
            cx="130"
            cy="60"
            rx="120"
            ry="50"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />
          <ellipse
            cx="130"
            cy="60"
            rx="90"
            ry="35"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />
          <ellipse
            cx="130"
            cy="60"
            rx="55"
            ry="18"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />

          {/* SGD軌跡（赤: 振動） */}
          <polyline
            points={toPolylinePoints(
              sgdPath.map((p) => ({ x: p.x, y: 60 + p.y * 0.8 })),
            )}
            fill="none"
            stroke={OPTIMIZER_COLORS.sgd}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Momentum軌跡（青: 減衰） */}
          <polyline
            points={toPolylinePoints(
              momentumPath.map((p) => ({ x: p.x, y: 60 + p.y * 0.8 })),
            )}
            fill="none"
            stroke={OPTIMIZER_COLORS.momentum}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* 凡例 */}
          <line
            x1="15"
            y1="10"
            x2="30"
            y2="10"
            stroke={OPTIMIZER_COLORS.sgd}
            strokeWidth="2"
          />
          <text x="33" y="14" fontSize="9" fill={OPTIMIZER_COLORS.sgd}>
            SGD（振動）
          </text>
          <line
            x1="15"
            y1="22"
            x2="30"
            y2="22"
            stroke={OPTIMIZER_COLORS.momentum}
            strokeWidth="2"
          />
          <text x="33" y="26" fontSize="9" fill={OPTIMIZER_COLORS.momentum}>
            Momentum（減衰）
          </text>
        </svg>
      </div>

      {/* PCの本質解説 */}
      <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
        <p>
          Pathological Curvature（病的曲率）とは、損失関数の等高線が極端に細長い楕円になる現象。
          ある方向には急峻、別の方向には緩やかな勾配を持つ。
        </p>
        <p>
          SGDはこの細長い谷で壁に跳ね返されるように振動し、収束が著しく遅くなる。
          この振動は局所最小値に陥ることとは全く異なる現象であり、
          最適解への経路上で起きる非効率な動きである。
        </p>
        <p>
          Momentumは慣性によって谷の長軸方向の移動を蓄積し、
          短軸方向の振動を相殺するため、収束を大幅に加速できる。
        </p>
      </div>

      {/* 選択肢分析テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                選択肢
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                判定
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                理由
              </th>
            </tr>
          </thead>
          <tbody>
            {PC_ANALYSIS_ROWS.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  !row.correct ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.label}
                </td>
                <td className="px-2 py-1.5 text-xs font-semibold">
                  {row.correct ? (
                    <span className="text-green-600 dark:text-green-400">
                      正しい
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      不適切
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 判別のコツ */}
      <div className="p-2.5 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200">
        「振動→収束遅延」と「局所最小値に陥る」は全く別の現象。Bだけ概念を混同
      </div>
    </section>
  );
}
