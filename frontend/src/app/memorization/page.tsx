'use client';

import Link from 'next/link';
import { MEMORIZATION_QUESTIONS, QUIZ_META } from '@/data/memorization-quiz';
import { useMemorizationQuiz } from '@/hooks/useMemorizationQuiz';
import { QuizSetup } from '@/components/memorization/QuizSetup';
import { QuizProgress } from '@/components/memorization/QuizProgress';
import { QuizQuestion } from '@/components/memorization/QuizQuestion';
import { QuizResults } from '@/components/memorization/QuizResults';

export default function MemorizationPage() {
  const quiz = useMemorizationQuiz(MEMORIZATION_QUESTIONS);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            暗記クイズ
          </h1>
          <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            ホームへ戻る
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6">
          {quiz.mode === 'setup' && (
            <QuizSetup
              categories={QUIZ_META.categories}
              onStart={quiz.startQuiz}
            />
          )}

          {quiz.mode === 'active' && quiz.currentQuestion && (
            <>
              <QuizProgress
                currentIndex={quiz.currentIndex}
                total={quiz.totalQuestions}
                correctCount={quiz.correctCount}
              />
              <QuizQuestion
                key={quiz.currentQuestion.id}
                question={quiz.currentQuestion}
                lastAnswer={quiz.lastAnswer}
                onAnswer={quiz.answerQuestion}
              />
              {quiz.lastAnswer && (
                <button
                  className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={quiz.nextQuestion}
                >
                  {quiz.currentIndex + 1 < quiz.totalQuestions ? '次へ' : '結果を見る'}
                </button>
              )}
            </>
          )}

          {quiz.mode === 'results' && quiz.sessionResult && (
            <QuizResults
              result={quiz.sessionResult}
              questions={MEMORIZATION_QUESTIONS}
              onRetry={quiz.retryIncorrect}
              onReset={quiz.resetQuiz}
              hasIncorrect={quiz.sessionResult.answers.some((a) => !a.isCorrect)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
