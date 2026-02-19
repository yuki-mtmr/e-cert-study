import type { MemorizationQuestion, QuizAnswerLabel, UserAnswer, CategoryStats } from '@/types/memorization';

/**
 * 正答率を計算（0除算ガード付き）
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/** 正答率しきい値 */
export const ACCURACY_THRESHOLDS = { GOOD: 80, FAIR: 50 } as const;

/**
 * 正答率からレベルを判定
 */
export function getAccuracyLevel(accuracy: number): 'good' | 'fair' | 'poor' {
  if (accuracy >= ACCURACY_THRESHOLDS.GOOD) return 'good';
  if (accuracy >= ACCURACY_THRESHOLDS.FAIR) return 'fair';
  return 'poor';
}

/**
 * 選択肢のCSSクラス名を回答状態に応じて決定
 */
export function getChoiceClassName(
  label: QuizAnswerLabel,
  isAnswered: boolean,
  correctAnswer: QuizAnswerLabel,
  userSelection: QuizAnswerLabel | null,
): string {
  const base = 'w-full text-left p-3 rounded-lg border transition-colors';
  if (!isAnswered) {
    return `${base} border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer`;
  }
  if (label === correctAnswer) {
    return `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
  }
  if (label === userSelection) {
    return `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
  }
  return `${base} border-gray-200 dark:border-gray-700 opacity-50`;
}

/**
 * Fisher-Yatesアルゴリズムで問題をシャッフル（元配列は変更しない）
 */
export function shuffleQuestions(questions: readonly MemorizationQuestion[]): MemorizationQuestion[] {
  const arr = [...questions];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 指定カテゴリの問題のみ返す
 */
export function filterByCategories(
  questions: readonly MemorizationQuestion[],
  categories: readonly string[],
): MemorizationQuestion[] {
  if (categories.length === 0) return [];
  const set = new Set(categories);
  return questions.filter((q) => set.has(q.category));
}

/**
 * 指定IDの問題のみ返す（順序はID配列に準拠）
 */
export function filterByIds(
  questions: readonly MemorizationQuestion[],
  ids: readonly number[],
): MemorizationQuestion[] {
  if (ids.length === 0) return [];
  const map = new Map(questions.map((q) => [q.id, q]));
  return ids.flatMap((id) => {
    const q = map.get(id);
    return q ? [q] : [];
  });
}

/**
 * カテゴリ別の正答率統計を計算
 */
export function calculateCategoryStats(
  questions: readonly MemorizationQuestion[],
  answers: readonly UserAnswer[],
): CategoryStats[] {
  if (answers.length === 0) return [];

  const qMap = new Map(questions.map((q) => [q.id, q]));
  const catMap = new Map<string, { total: number; correct: number }>();

  for (const a of answers) {
    const q = qMap.get(a.questionId);
    if (!q) continue;
    const entry = catMap.get(q.category) ?? { total: 0, correct: 0 };
    entry.total++;
    if (a.isCorrect) entry.correct++;
    catMap.set(q.category, entry);
  }

  return Array.from(catMap.entries()).map(([category, { total, correct }]) => ({
    category,
    total,
    correct,
    accuracy: calculateAccuracy(correct, total),
  }));
}

/**
 * 不正解の問題のみ返す
 */
export function getIncorrectQuestions(
  questions: readonly MemorizationQuestion[],
  answers: readonly UserAnswer[],
): MemorizationQuestion[] {
  const incorrectIds = new Set(
    answers.filter((a) => !a.isCorrect).map((a) => a.questionId),
  );
  return questions.filter((q) => incorrectIds.has(q.id));
}
