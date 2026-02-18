'use client';

import { useState } from 'react';
import type {
  ExamCodeProblemData,
  ChoiceLabel,
} from '@/lib/visual-explanations/exam-code-problem-types';

interface Props {
  data: ExamCodeProblemData;
}

/** 試験形式の4択コード穴埋め問題コンポーネント */
export function ExamCodeProblem({ data }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, ChoiceLabel | null>
  >({});
  const [revealedAnswers, setRevealedAnswers] = useState<
    Record<string, boolean>
  >({});

  const currentSq = data.subQuestions[activeTab];
  const selectedLabel = selectedAnswers[currentSq.id] ?? null;
  const isRevealed = revealedAnswers[currentSq.id] ?? false;
  const isCorrect = selectedLabel === currentSq.correctLabel;

  const handleSelect = (label: ChoiceLabel) => {
    if (isRevealed) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentSq.id]: label }));
  };

  const handleReveal = () => {
    setRevealedAnswers((prev) => ({ ...prev, [currentSq.id]: true }));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
        {data.title}
      </h4>

      {/* クラスコード全体 */}
      <pre
        data-testid="exam-class-code"
        className="p-3 rounded-lg bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre"
      >
        {data.classCode}
      </pre>

      {/* 小問タブ */}
      <div className="flex gap-1" role="tablist">
        {data.subQuestions.map((sq, i) => (
          <button
            key={sq.id}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-t text-xs font-medium transition-colors ${
              activeTab === i
                ? 'bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            小問{sq.number}({sq.blankLabel})
          </button>
        ))}
      </div>

      {/* 小問パネル */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-b-lg rounded-tr-lg p-4 bg-white dark:bg-gray-800 space-y-4">
        {/* 空欄のコードコンテキスト */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          空欄({currentSq.blankLabel})がある行:
        </div>
        <pre className="p-2 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono">
          {currentSq.codeContext}
        </pre>

        {/* 4択ラジオボタン */}
        <div className="space-y-2">
          {currentSq.choices.map((choice) => {
            const isSelected = selectedLabel === choice.label;
            let extraClass = '';
            if (isRevealed) {
              if (choice.label === currentSq.correctLabel) {
                extraClass =
                  'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
              } else if (isSelected) {
                extraClass = 'border-red-400 bg-red-50 dark:bg-red-900/20';
              }
            }

            return (
              <label
                key={choice.label}
                className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  isSelected && !isRevealed
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                } ${extraClass}`}
              >
                <input
                  type="radio"
                  name={`exam-${data.id}-${currentSq.id}`}
                  value={choice.label}
                  checked={isSelected}
                  onChange={() => handleSelect(choice.label)}
                  disabled={isRevealed}
                />
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  {choice.label}.
                </span>
                <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  {choice.code}
                </code>
              </label>
            );
          })}
        </div>

        {/* 解答を確認ボタン */}
        {!isRevealed && (
          <button
            onClick={handleReveal}
            disabled={selectedLabel === null}
            className="px-4 py-2 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            解答を確認
          </button>
        )}

        {/* 正誤結果 + 解説 */}
        {isRevealed && (
          <div className="space-y-3">
            <div
              data-testid="exam-result"
              className={`p-3 rounded-lg text-sm font-bold ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              {isCorrect
                ? '正解!'
                : `不正解 — 正解は ${currentSq.correctLabel}`}
            </div>
            <div
              data-testid="exam-explanation"
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              {currentSq.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
