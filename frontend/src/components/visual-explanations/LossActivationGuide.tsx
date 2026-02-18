'use client';

import { getTaskCombos } from '@/lib/visual-explanations/loss-activation-combos';

const COMBOS = getTaskCombos();

/** 損失関数×活性化関数の組み合わせガイド（簡素化版） */
export function LossActivationGuide() {
  return (
    <div className="space-y-4">
      {/* 3タスクの比較テーブル */}
      <section>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          タスク別：活性化関数 × 損失関数
        </h4>
        <div className="space-y-2">
          {COMBOS.map((c) => (
            <div
              key={c.id}
              data-testid="task-row"
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-1.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {c.taskName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {c.example}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    活性化:
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {c.activation}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    損失:
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {c.loss}
                  </span>
                </div>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {c.keyPoint}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 見分け方のキールール */}
      <section>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          見分け方
        </h4>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
            <span className="font-bold text-blue-700 dark:text-blue-300">
              排他的（1つだけ選ぶ）
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {' '}→ Softmax + CE
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20">
            <span className="font-bold text-violet-700 dark:text-violet-300">
              独立（各出力が個別に0/1）
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {' '}→ Sigmoid + BCE
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
