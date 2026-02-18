'use client';

import { useState } from 'react';
import katex from 'katex';
import {
  getQuestions,
  softmax1D,
  crossEntropyLoss,
  PIPELINE_COLORS,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import type { QuestionId } from '@/lib/visual-explanations/softmax-cross-entropy';
import { AxisKeepdimsDemo } from './AxisKeepdimsDemo';
import { BackwardGradientChart } from './BackwardGradientChart';

const QUESTIONS = getQuestions();

/** パイプラインのステージ定義 */
const PIPELINE_STAGES = [
  { key: 'input', label: 'x', color: PIPELINE_COLORS.input, question: null },
  { key: 'softmax', label: 'softmax', color: PIPELINE_COLORS.softmax, question: 'q1-axis-keepdims' as QuestionId },
  { key: 'y', label: 'y', color: PIPELINE_COLORS.softmax, question: null },
  { key: 'ce', label: 'CE(y,t)', color: PIPELINE_COLORS.loss, question: 'q2-ce-return' as QuestionId },
  { key: 'loss', label: 'loss', color: PIPELINE_COLORS.loss, question: null },
  { key: 'backward', label: 'backward', color: PIPELINE_COLORS.gradient, question: 'q4-backward-grad' as QuestionId },
  { key: 'dx', label: 'dx', color: PIPELINE_COLORS.gradient, question: null },
] as const;

/** Q2: 交差エントロピーのインライン解説 */
function Q2InlineExplanation() {
  // softmax出力例
  const y = softmax1D([2.0, 1.0, 0.1]);
  const tIndex = 0;
  const loss = crossEntropyLoss(y, tIndex);

  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-gray-500 dark:text-gray-400">softmax出力 y:</div>
      <div className="flex gap-2">
        {y.map((v, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded font-mono text-sm ${
              i === tIndex
                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 font-bold'
                : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
            }`}
          >
            y[{i}]={v.toFixed(3)}
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        正解ラベル t={tIndex} → np.arange(N)=[0], t=[{tIndex}] → y[0, {tIndex}]={y[tIndex].toFixed(3)}
      </div>
      <div className="text-xs font-mono">
        -log({y[tIndex].toFixed(3)}) = {loss.toFixed(4)}
      </div>
    </div>
  );
}

/** Q3: forward引数順のインライン解説 */
function Q3InlineExplanation() {
  const steps = [
    { label: '1. softmax(x)', desc: 'ロジット → 確率分布', arrow: '→', result: 'self.y' },
    { label: '2. 教師ラベル保存', desc: 't をそのまま保存', arrow: '→', result: 'self.t' },
    { label: '3. CE(self.y, self.t)', desc: '確率分布+教師 → 損失', arrow: '→', result: 'self.loss' },
  ];

  return (
    <div className="space-y-2 text-sm">
      <div className="text-xs text-gray-500 dark:text-gray-400">forwardの変数フロー:</div>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800"
          >
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {s.label}
            </span>
            <span className="text-gray-400">{s.arrow}</span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{s.desc}</span>
            <span className="text-gray-400">{s.arrow}</span>
            <span className="text-xs font-mono font-bold">{s.result}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-amber-700 dark:text-amber-300 p-2 rounded bg-amber-50 dark:bg-amber-900/20">
        self.y と self.t はbackwardで再利用するため、forwardで必ず保存する。
      </div>
    </div>
  );
}

/** Softmax + クロスエントロピー コード問題解説 メインコンポーネント */
export function SoftmaxCrossEntropyCodeProblem() {
  const [activeQuestion, setActiveQuestion] = useState<QuestionId>('q1-axis-keepdims');

  const currentQ = QUESTIONS.find((q) => q.id === activeQuestion)!;

  const answerHtml = katex.renderToString(currentQ.answerLatex, {
    throwOnError: false,
    displayMode: true,
  });

  return (
    <div className="space-y-4">
      {/* パイプライン概要図 */}
      <div
        data-testid="pipeline-overview"
        className="flex flex-wrap items-center gap-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-x-auto"
      >
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-gray-400 text-xs">→</span>
            )}
            <div
              data-testid={`pipeline-box-${stage.key}`}
              onClick={() => {
                if (stage.question) setActiveQuestion(stage.question);
              }}
              className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                stage.question ? 'cursor-pointer hover:opacity-80' : ''
              }`}
              style={{
                backgroundColor: `${stage.color.hex}20`,
                color: stage.color.hex,
                borderWidth: 1,
                borderColor: `${stage.color.hex}40`,
              }}
            >
              {stage.label}
            </div>
          </div>
        ))}
        {/* 教師ラベル t（CE入力への矢印） */}
        <div className="ml-2 flex items-center gap-1">
          <span className="text-xs text-gray-400">↑</span>
          <div
            data-testid="pipeline-box-teacher"
            onClick={() => setActiveQuestion('q3-forward-args')}
            className="px-2 py-1 rounded text-xs font-mono font-medium cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: `${PIPELINE_COLORS.teacher.hex}20`,
              color: PIPELINE_COLORS.teacher.hex,
              borderWidth: 1,
              borderColor: `${PIPELINE_COLORS.teacher.hex}40`,
            }}
          >
            t
          </div>
        </div>
      </div>

      {/* Q1-Q4 タブボタン */}
      <div className="flex gap-1" role="tablist">
        {QUESTIONS.map((q) => (
          <button
            key={q.id}
            role="tab"
            aria-selected={activeQuestion === q.id}
            onClick={() => setActiveQuestion(q.id)}
            className={`px-3 py-1.5 rounded-t text-xs font-medium transition-colors ${
              activeQuestion === q.id
                ? 'bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Q{q.number}: {q.title}
          </button>
        ))}
      </div>

      {/* 小問パネル */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-b-lg rounded-tr-lg p-4 bg-white dark:bg-gray-800 space-y-4">
        {/* コードスニペット */}
        <div data-testid="code-snippet">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">穴埋めコード:</div>
          <pre className="p-3 rounded bg-gray-900 text-green-400 text-sm font-mono overflow-x-auto">
            {currentQ.codeSnippet}
          </pre>
        </div>

        {/* 正解テキスト */}
        <div data-testid="answer-text">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">正解:</div>
          <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-mono mb-2">{currentQ.answer}</div>
            <div
              className="overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: answerHtml }}
            />
          </div>
        </div>

        {/* 解説テキスト */}
        <div data-testid="explanation-text" className="text-sm text-gray-700 dark:text-gray-300">
          {currentQ.explanation}
        </div>

        {/* ビジュアル解説 */}
        {activeQuestion === 'q1-axis-keepdims' && <AxisKeepdimsDemo />}
        {activeQuestion === 'q2-ce-return' && <Q2InlineExplanation />}
        {activeQuestion === 'q3-forward-args' && <Q3InlineExplanation />}
        {activeQuestion === 'q4-backward-grad' && <BackwardGradientChart />}
      </div>
    </div>
  );
}
