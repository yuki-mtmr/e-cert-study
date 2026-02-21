'use client';

import { useMemo } from 'react';
import {
  softmax1D,
  crossEntropyLoss,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import { KeyPoint } from './shared';

const SAMPLE_LOGITS = [
  [2.0, 1.0, 0.1],
  [1.0, 3.0, 0.2],
  [0.5, 0.3, 2.5],
];
const TEACHER_LABELS = [0, 2, 1];

export function CrossEntropySteps() {
  const softmaxRows = useMemo(
    () => SAMPLE_LOGITS.map((row) => softmax1D(row)),
    [],
  );
  const losses = useMemo(
    () => softmaxRows.map((row, i) => crossEntropyLoss(row, TEACHER_LABELS[i])),
    [softmaxRows],
  );
  const avgLoss = useMemo(
    () => losses.reduce((a, b) => a + b, 0) / losses.length,
    [losses],
  );

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold">2. クロスエントロピー計算ステップ</h3>

      {/* ステップ1: softmax出力グリッド + ファンシーインデックス */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-500">
          Step 1: softmax出力 y — 正解クラスをピックアップ
        </div>

        {/* 教師ラベル表示 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">教師ラベル t =</span>
          <div className="flex gap-1">
            {TEACHER_LABELS.map((t, i) => (
              <span
                key={i}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* softmax出力グリッド（ファンシーインデックスのハイライト） */}
        <div className="space-y-1">
          {softmaxRows.map((row, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-14 text-xs text-gray-400 font-mono shrink-0">
                y[{i}]
              </span>
              {row.map((v, c) => {
                const isTarget = c === TEACHER_LABELS[i];
                return (
                  <div
                    key={c}
                    className={`w-16 h-9 flex items-center justify-center rounded font-mono text-xs
                      ${isTarget
                        ? 'bg-emerald-500/20 border-2 border-emerald-500 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                  >
                    {v.toFixed(3)}
                  </div>
                );
              })}
              {/* 矢印 → -log(p) */}
              <span className="text-gray-400 mx-1">→</span>
              <span className="text-xs font-mono text-red-500 dark:text-red-400">
                -log({softmaxRows[i][TEACHER_LABELS[i]].toFixed(3)})
              </span>
              <span className="text-gray-400 mx-0.5">=</span>
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                {losses[i].toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        {/* インデックス説明 */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span className="font-mono">y[np.arange(3), t]</span>
          <span>=</span>
          <span className="font-mono">y[</span>
          {TEACHER_LABELS.map((t, i) => (
            <span key={i}>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                [{i},{t}]
              </span>
              {i < 2 && <span className="text-gray-400">, </span>}
            </span>
          ))}
          <span className="font-mono">]</span>
        </div>
      </div>

      {/* ステップ2: 平均 → Loss */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500">Step 2:</span>
        <span className="text-sm font-mono">
          Loss = ({losses.map((l) => l.toFixed(2)).join(' + ')}) / {losses.length}
        </span>
        <span className="text-lg text-gray-400">=</span>
        <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
          {avgLoss.toFixed(3)}
        </span>
      </div>

      <KeyPoint text="np.arange(N)とtで各サンプルの正解クラス確率だけを取得" />
    </section>
  );
}
