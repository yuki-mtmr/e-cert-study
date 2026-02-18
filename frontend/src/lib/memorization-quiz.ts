import type { MemorizationQuestion, UserAnswer, CategoryStats } from '@/types/memorization';

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
    accuracy: Math.round((correct / total) * 100),
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
