interface QuizProgressProps {
  currentIndex: number;
  total: number;
  correctCount: number;
}

export function QuizProgress({ currentIndex, total, correctCount }: QuizProgressProps) {
  const current = currentIndex + 1;
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {current} / {total}
        </span>
        <span className="text-sm text-green-600 dark:text-green-400">
          正解: {correctCount}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
      >
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
