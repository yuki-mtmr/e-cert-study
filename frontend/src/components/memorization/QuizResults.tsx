import type { QuizSessionResult, MemorizationQuestion } from '@/types/memorization';
import { calculateCategoryStats, getIncorrectQuestions } from '@/lib/memorization-quiz';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface QuizResultsProps {
  result: QuizSessionResult;
  questions: readonly MemorizationQuestion[];
  onRetry: () => void;
  onReset: () => void;
  hasIncorrect: boolean;
}

export function QuizResults({ result, questions, onRetry, onReset, hasIncorrect }: QuizResultsProps) {
  const categoryStats = calculateCategoryStats(questions, result.answers);
  const incorrectQuestions = getIncorrectQuestions(questions, result.answers);

  return (
    <div>
      {/* スコアサマリー */}
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {result.accuracy}%
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          {result.correctCount} / {result.totalQuestions}
        </p>
      </div>

      {/* カテゴリ別正答率 */}
      {categoryStats.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            カテゴリ別正答率
          </h3>
          <div className="space-y-2">
            {categoryStats.map((s) => (
              <div key={s.category} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">{s.category}</span>
                <span className={s.accuracy >= 80 ? 'text-green-600' : s.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                  {s.correct}/{s.total} ({s.accuracy}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 間違い一覧 */}
      {incorrectQuestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            間違えた問題
          </h3>
          <div className="space-y-3">
            {incorrectQuestions.map((q) => {
              const userAnswer = result.answers.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
                  <MarkdownRenderer content={q.question} className="text-gray-800 dark:text-gray-200 mb-1" />
                  <p className="text-red-600 dark:text-red-400">
                    あなたの回答: {userAnswer?.selected}
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    正解: {q.answer}
                  </p>
                  <MarkdownRenderer content={q.hint} className="text-gray-500 dark:text-gray-400 mt-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3">
        {hasIncorrect && (
          <button
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            onClick={onRetry}
          >
            間違いだけ再挑戦
          </button>
        )}
        <button
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          onClick={onReset}
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
