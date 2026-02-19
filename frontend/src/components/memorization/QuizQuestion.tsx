'use client';

import type { MemorizationQuestion, QuizAnswerLabel, UserAnswer } from '@/types/memorization';
import { QUIZ_ANSWER_LABELS } from '@/types/memorization';
import { getChoiceClassName } from '@/lib/memorization-quiz';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface QuizQuestionProps {
  question: MemorizationQuestion;
  lastAnswer: UserAnswer | null;
  onAnswer: (selected: QuizAnswerLabel) => void;
}

export function QuizQuestion({ question, lastAnswer, onAnswer }: QuizQuestionProps) {
  const answered = lastAnswer !== null;

  return (
    <div>
      {/* カテゴリ */}
      <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mb-3">
        {question.category}
      </span>

      {/* 問題文 */}
      <MarkdownRenderer content={question.question} className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed" />

      {/* 回答フィードバック */}
      {answered && (
        <div className={`text-center text-2xl font-bold mb-3 ${lastAnswer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {lastAnswer.isCorrect ? '○' : '×'}
        </div>
      )}

      {/* 選択肢 */}
      <div className="space-y-2 mb-4">
        {QUIZ_ANSWER_LABELS.map((label, i) => (
          <button
            key={label}
            className={getChoiceClassName(label, answered, question.answer, lastAnswer?.selected ?? null)}
            onClick={() => !answered && onAnswer(label)}
            disabled={answered}
          >
            <span className="font-medium mr-2">{label}.</span>
            <MarkdownRenderer content={question.choices[i]} className="inline" />
          </button>
        ))}
      </div>

      {/* 回答後にヒントを自動表示 */}
      {answered && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
          <MarkdownRenderer content={question.hint} />
        </div>
      )}
    </div>
  );
}
