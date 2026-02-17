'use client';

import type { FittingState } from '@/lib/visual-explanations/curves';

interface ErrorStatusDisplayProps {
  trainingError: number;
  generalizationError: number;
  fittingState: FittingState;
}

const STATE_LABELS: Record<FittingState, { text: string; color: string }> = {
  underfitting: { text: '過少適合', color: 'text-blue-600 dark:text-blue-400' },
  optimal: { text: '最適', color: 'text-green-600 dark:text-green-400' },
  overfitting: { text: '過剰適合', color: 'text-red-600 dark:text-red-400' },
};

/** 誤差バー + 状態ラベルの表示 */
export function ErrorStatusDisplay({
  trainingError,
  generalizationError,
  fittingState,
}: ErrorStatusDisplayProps) {
  const stateInfo = STATE_LABELS[fittingState];

  return (
    <div className="space-y-2 text-sm">
      {/* 状態ラベル */}
      <div className={`font-bold ${stateInfo.color}`}>
        {stateInfo.text}
      </div>

      {/* 訓練誤差バー */}
      <div className="flex items-center gap-2">
        <span className="w-16 text-gray-600 dark:text-gray-400">訓練誤差</span>
        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            data-testid="training-error-bar"
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${trainingError * 100}%` }}
          />
        </div>
        <span className="w-10 text-right font-mono text-gray-700 dark:text-gray-300">
          {trainingError.toFixed(2)}
        </span>
      </div>

      {/* 汎化誤差バー */}
      <div className="flex items-center gap-2">
        <span className="w-16 text-gray-600 dark:text-gray-400">汎化誤差</span>
        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            data-testid="generalization-error-bar"
            className="h-full bg-red-500 rounded-full transition-all"
            style={{ width: `${generalizationError * 100}%` }}
          />
        </div>
        <span className="w-10 text-right font-mono text-gray-700 dark:text-gray-300">
          {generalizationError.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
