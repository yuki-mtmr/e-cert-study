'use client';

const SUMMARY_ROWS = [
  {
    aspect: '更新式',
    sgd: 'θ − η∇J',
    momentum: 'v=γv+η∇J; θ−v',
    nag: 'v=γv+η∇J(θ−γv); θ−v',
  },
  {
    aspect: '利点',
    sgd: 'シンプル',
    momentum: '振動抑制・加速',
    nag: '先読みで過剰更新抑制',
  },
  {
    aspect: '弱点',
    sgd: 'PCに弱い',
    momentum: '先読みなし',
    nag: '計算コスト微増',
  },
];

export function SummarySection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">4. 3手法まとめ比較</h3>

      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500" />
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                SGD
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                Momentum
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                NAG
              </th>
            </tr>
          </thead>
          <tbody>
            {SUMMARY_ROWS.map((row) => (
              <tr
                key={row.aspect}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {row.aspect}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.sgd}</td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.momentum}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.nag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
