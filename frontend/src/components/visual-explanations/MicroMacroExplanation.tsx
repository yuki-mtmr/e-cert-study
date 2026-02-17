'use client';

import { useState, useMemo } from 'react';
import {
  getDefaultMatrix,
  deriveClassMetrics,
  computeMacroAverage,
  computeMicroAverage,
} from '@/lib/visual-explanations/micro-macro-average';
import type { ConfusionMatrix3x3 } from '@/lib/visual-explanations/micro-macro-average';
import { EditableConfusionMatrix3x3 } from './EditableConfusionMatrix3x3';
import { MacroMicroCalculation } from './MacroMicroCalculation';
import { AverageBarChart } from './AverageBarChart';
import { AverageQuizGame } from './AverageQuizGame';

/** マイクロ平均・マクロ平均 の親コンポーネント（5セクション結合） */
export function MicroMacroExplanation() {
  const [matrix, setMatrix] = useState<ConfusionMatrix3x3>(getDefaultMatrix);

  const metrics = useMemo(() => deriveClassMetrics(matrix), [matrix]);
  const macro = useMemo(() => computeMacroAverage(metrics), [metrics]);
  const micro = useMemo(() => computeMicroAverage(metrics), [metrics]);

  return (
    <div className="space-y-8">
      {/* セクション1: 混同行列入力 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          3クラス混同行列
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          値を変更するとマクロ/マイクロ平均がリアルタイムで更新されます。
        </p>
        <EditableConfusionMatrix3x3 matrix={matrix} onChange={setMatrix} />
      </section>

      {/* セクション2: 計算過程 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          計算過程
        </h3>
        <MacroMicroCalculation metrics={metrics} />
      </section>

      {/* セクション3: バーチャート比較 */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          比較チャート
        </h3>
        <AverageBarChart macro={macro} micro={micro} />
      </section>

      {/* セクション4: 使い分けのポイント */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          使い分けのポイント
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <div className="font-bold text-blue-700 dark:text-blue-300 mb-1">
              マクロ平均
            </div>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>各クラスを等しく扱う</li>
              <li>少数クラスの性能を重視</li>
              <li>不均衡データで真価を発揮</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="font-bold text-green-700 dark:text-green-300 mb-1">
              マイクロ平均
            </div>
            <ul className="text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
              <li>サンプル数で重み付け</li>
              <li>全体の正解率に近い</li>
              <li>多数派クラスの影響大</li>
            </ul>
          </div>
        </div>
      </section>

      {/* セクション5: クイズ */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          理解度チェック
        </h3>
        <AverageQuizGame />
      </section>
    </div>
  );
}
