'use client';

import { OPTIMIZER_COLORS } from '@/lib/visual-explanations/optimizer-momentum';

const NAG_COMPARISON_ROWS = [
  {
    aspect: '速度更新式',
    momentum: 'v = γv + η∇J(θ)',
    nag: 'v = γv + η∇J(θ - γv)',
  },
  {
    aspect: '勾配評価位置',
    momentum: '現在位置 θ',
    nag: '先読み位置 θ - γv',
  },
  {
    aspect: '利点',
    momentum: '振動抑制・加速',
    nag: '過剰更新を先読みで抑制',
  },
];

export function NagLookaheadSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">2. NAG先読みの仕組み</h3>

      {/* SVG等高線図 */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-md" role="img">
          <title>NAG先読み図</title>
          {/* 等高線（楕円） */}
          <ellipse
            cx="200"
            cy="100"
            rx="90"
            ry="50"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />
          <ellipse
            cx="200"
            cy="100"
            rx="60"
            ry="30"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />
          <ellipse
            cx="200"
            cy="100"
            rx="30"
            ry="12"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />

          {/* 現在位置 θ (blue) */}
          <circle
            cx="120"
            cy="80"
            r="6"
            fill={OPTIMIZER_COLORS.currentPos}
          />
          <text
            x="106"
            y="72"
            fontSize="12"
            fill={OPTIMIZER_COLORS.currentPos}
            fontWeight="bold"
          >
            θ
          </text>

          {/* 先読み位置 θ-γv (amber) */}
          <circle
            cx="175"
            cy="90"
            r="6"
            fill={OPTIMIZER_COLORS.lookAhead}
          />
          <text
            x="155"
            y="82"
            fontSize="11"
            fill={OPTIMIZER_COLORS.lookAhead}
            fontWeight="bold"
          >
            θ−γv
          </text>

          {/* 矢印: θ → θ-γv */}
          <line
            x1="126"
            y1="80"
            x2="168"
            y2="90"
            stroke={OPTIMIZER_COLORS.lookAhead}
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />

          {/* Momentum勾配 (blue矢印: θから下向き) */}
          <line
            x1="120"
            y1="86"
            x2="120"
            y2="120"
            stroke={OPTIMIZER_COLORS.currentPos}
            strokeWidth="2"
            markerEnd="url(#arrowBlue)"
          />
          <text
            x="80"
            y="115"
            fontSize="10"
            fill={OPTIMIZER_COLORS.currentPos}
          >
            ∇J(θ)
          </text>

          {/* NAG勾配 (amber矢印: θ-γvから下向き) */}
          <line
            x1="175"
            y1="96"
            x2="190"
            y2="105"
            stroke={OPTIMIZER_COLORS.lookAhead}
            strokeWidth="2"
            markerEnd="url(#arrowAmber)"
          />
          <text
            x="192"
            y="108"
            fontSize="10"
            fill={OPTIMIZER_COLORS.lookAhead}
          >
            ∇J(θ−γv)
          </text>

          {/* 矢印マーカー定義 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.lookAhead}
              />
            </marker>
            <marker
              id="arrowBlue"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.currentPos}
              />
            </marker>
            <marker
              id="arrowAmber"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.lookAhead}
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Momentum vs NAG 比較テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500" />
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                Momentum
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                NAG
              </th>
            </tr>
          </thead>
          <tbody>
            {NAG_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.aspect}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {row.aspect}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.momentum}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.nag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NAG先読み位置の解説 */}
      <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
        <p>
          NAGの核心は「まず慣性で進んだ先（θ − γv）で勾配を測る」こと。
          これにより、行き過ぎそうなときに事前にブレーキをかけられる。
        </p>
        <p>
          なぜ θ − γv であって θ − v ではないのか？
          γで速度vをスケーリングすることで先読み量を調整している。
          γ=0.9なら速度の90%分だけ先を見る。γなしの θ − v は
          速度をそのまま使うため先読み量の制御ができず、NAGの正しい定式化ではない。
        </p>
        <p>
          注意: (1-γ)パターン（例: v = (1-γ)v + γ·新値）は指数移動平均の定式化であり別概念。
          NAGの先読み θ − γv の γ とは役割が異なる。混同しないこと。
        </p>
      </div>

      {/* 即答ポイント */}
      <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
        先読み位置は θ − γv。γ付きが正しい。θ − v（γなし）は誤り
      </div>
    </section>
  );
}
