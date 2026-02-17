'use client';

import { useState } from 'react';
import katex from 'katex';

type StepId = 'start' | 'check-bias' | 'result-noise' | 'result-bias' | 'result-variance';

interface FlowStep {
  id: StepId;
  question?: string;
  /** 質問内の数式部分（KaTeX inline描画） */
  latexPart?: string;
  /** latexPartの後に続くテキスト */
  textAfterLatex?: string;
  yesTarget?: StepId;
  noTarget?: StepId;
  result?: string;
  resultColor?: string;
}

const STEPS: FlowStep[] = [
  {
    id: 'start',
    question: '∬（二重積分）がある？',
    latexPart: '\\iint',
    textAfterLatex: '（二重積分）がある？',
    yesTarget: 'result-noise',
    noTarget: 'check-bias',
  },
  {
    id: 'check-bias',
    question: 'E_D[y] − h(x) がある？',
    latexPart: 'E_D[y] - h(x)',
    textAfterLatex: ' がある？',
    yesTarget: 'result-bias',
    noTarget: 'result-variance',
  },
  {
    id: 'result-noise',
    result: 'Noise 確定',
    resultColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'result-bias',
    result: 'Bias² 確定',
    resultColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'result-variance',
    result: 'Variance 確定',
    resultColor: 'text-blue-600 dark:text-blue-400',
  },
];

/** ステップバイステップ判別フロー（状態マシン） */
export function IdentificationFlowchart() {
  const [currentId, setCurrentId] = useState<StepId>('start');
  const step = STEPS.find((s) => s.id === currentId)!;
  const isResult = !!step.result;

  return (
    <div data-testid="identification-flowchart" className="space-y-3">
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
        {isResult ? (
          <div className="space-y-3">
            <div className={`text-lg font-bold ${step.resultColor}`}>
              {step.result}
            </div>
            <button
              onClick={() => setCurrentId('start')}
              className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              リセット
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {step.latexPart ? (
                <>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(step.latexPart, {
                        throwOnError: false,
                        displayMode: false,
                      }),
                    }}
                  />
                  {step.textAfterLatex}
                </>
              ) : (
                step.question
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCurrentId(step.yesTarget!)}
                className="px-4 py-1.5 text-sm rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                はい
              </button>
              <button
                onClick={() => setCurrentId(step.noTarget!)}
                className="px-4 py-1.5 text-sm rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                いいえ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
