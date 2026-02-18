'use client';

import { useState } from 'react';
import type { MemorizationQuestion, QuizAnswerLabel, UserAnswer } from '@/types/memorization';

const LABELS: QuizAnswerLabel[] = ['A', 'B', 'C', 'D'];

interface QuizQuestionProps {
  question: MemorizationQuestion;
  lastAnswer: UserAnswer | null;
  onAnswer: (selected: QuizAnswerLabel) => void;
}

export function QuizQuestion({ question, lastAnswer, onAnswer }: QuizQuestionProps) {
  const [showHint, setShowHint] = useState(false);
  const answered = lastAnswer !== null;

  /**
   * 選択肢のスタイルを回答状態に応じて決定
   */
  function choiceStyle(label: QuizAnswerLabel): string {
    const base = 'w-full text-left p-3 rounded-lg border transition-colors';
    if (!answered) {
      return `${base} border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer`;
    }

    // 正解の選択肢
    if (label === question.answer) {
      return `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
    }
    // ユーザーが選んだ不正解の選択肢
    if (label === lastAnswer.selected && !lastAnswer.isCorrect) {
      return `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
    }
    return `${base} border-gray-200 dark:border-gray-700 opacity-50`;
  }

  return (
    <div>
      {/* カテゴリ */}
      <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mb-3">
        {question.category}
      </span>

      {/* 問題文 */}
      <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">
        {question.question}
      </p>

      {/* 回答フィードバック */}
      {answered && (
        <div className={`text-center text-2xl font-bold mb-3 ${lastAnswer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {lastAnswer.isCorrect ? '○' : '×'}
        </div>
      )}

      {/* 選択肢 */}
      <div className="space-y-2 mb-4">
        {LABELS.map((label, i) => (
          <button
            key={label}
            className={choiceStyle(label)}
            onClick={() => !answered && onAnswer(label)}
            disabled={answered}
          >
            <span className="font-medium mr-2">{label}.</span>
            {question.choices[i]}
          </button>
        ))}
      </div>

      {/* ヒント */}
      <button
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        onClick={() => setShowHint(!showHint)}
      >
        ヒント
      </button>
      {showHint && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
          {question.hint}
        </p>
      )}
    </div>
  );
}
