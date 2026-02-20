'use client';

import { OPTIMIZER_COLORS } from '@/lib/visual-explanations/optimizer-momentum';

function FlowBox({
  label,
  color,
  highlight,
}: {
  label: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-mono border ${
        highlight ? 'ring-2 ring-offset-1' : ''
      }`}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-gray-400">→</span>;
}

const ELIMINATION_ROWS = [
  { label: 'A', formula: 'γv - η∇J', reason: '符号がマイナス（v内部はプラスが正しい）', correct: false },
  { label: 'B', formula: 'γv + η∇J', reason: 'γ(~0.9)→v, η(~0.01)→∇J で正しい', correct: true },
  { label: 'C', formula: 'ηv + γ∇J', reason: 'γとηの位置が逆', correct: false },
  { label: 'D', formula: 'ηv - γ∇J', reason: 'γとηの位置が逆＋符号もマイナス', correct: false },
];

export function MomentumUpdateSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. Momentum更新式の導出</h3>

      {/* フロー図 */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">
          パラメータ更新の流れ
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <FlowBox label="θ" color="#6366F1" />
          <Arrow />
          <FlowBox label="θ - v_t" color="#6366F1" />
          <Arrow />
          <FlowBox label="v_t" color={OPTIMIZER_COLORS.momentum} highlight />
          <span className="text-xs text-gray-500">=</span>
          <FlowBox label="γv_{t-1} + η∇J" color={OPTIMIZER_COLORS.momentum} />
        </div>
      </div>

      {/* 更新式の導出解説 */}
      <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
        <p>
          SGDは現在の勾配 ∇J だけを使うため、損失曲面の局所的な傾きに振り回されやすい。
          Momentumでは速度項 v を導入し、過去の勾配情報を蓄積する。
        </p>
        <p>
          v_t = γ v_{'{t-1}'} + η∇J において、γ（通常0.9程度）は
          過去の勾配を指数的に減衰させる加重平均の役割を果たす。
          直近の勾配ほど重みが大きく、古い勾配は γ^k で急速に減衰する。
        </p>
        <p>
          この慣性効果により、勾配方向が一貫しているときは加速し、
          方向が変わるときは慣性がブレーキとなって振動を抑える。
        </p>
      </div>

      {/* 消去法テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                選択肢
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                式
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                理由
              </th>
            </tr>
          </thead>
          <tbody>
            {ELIMINATION_ROWS.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  row.correct
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : ''
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.label}
                  {row.correct && (
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      ✓
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.formula}
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
      <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
        γ(~0.9)はv_{'{t-1}'}に、η(~0.01)は∇Jに。この大小関係で即判別
      </div>
    </section>
  );
}
