/**
 * 暗記クイズの型定義
 */

/** 選択肢ラベル */
export type QuizAnswerLabel = 'A' | 'B' | 'C' | 'D';

/** 暗記クイズ問題 */
export interface MemorizationQuestion {
  id: number;
  category: string;
  question: string;
  choices: [string, string, string, string];
  answer: QuizAnswerLabel;
  hint: string;
}

/** クイズモード */
export type QuizMode = 'setup' | 'active' | 'results';

/** ユーザーの回答記録 */
export interface UserAnswer {
  questionId: number;
  selected: QuizAnswerLabel;
  isCorrect: boolean;
}

/** クイズセッション結果 */
export interface QuizSessionResult {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  answers: UserAnswer[];
}

/** カテゴリ別統計 */
export interface CategoryStats {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
}

/** クイズメタデータ */
export interface QuizMeta {
  title: string;
  version: string;
  totalQuestions: number;
  categories: string[];
}
