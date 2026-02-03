/**
 * アプリケーション共通の型定義
 */

/**
 * カテゴリ
 */
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

/**
 * カテゴリツリー（階層構造）
 */
export interface CategoryTree {
  id: string;
  name: string;
  parentId: string | null;
  children: CategoryTree[];
  questionCount?: number;
}

/**
 * 問題画像
 */
export interface QuestionImage {
  id: string;
  questionId: string;
  filePath: string;
  altText: string | null;
  position: number;
  imageType: string | null;
}

/**
 * コンテンツタイプ
 */
export type ContentType = 'plain' | 'markdown' | 'code';

/**
 * 問題
 */
export interface Question {
  id: string;
  categoryId: string;
  content: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  source: string;
  contentType: ContentType;
  images: QuestionImage[];
}

/**
 * 回答履歴
 */
export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  answeredAt: string;
}

/**
 * 問題作成リクエスト
 */
export interface CreateQuestionRequest {
  categoryId: string;
  content: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  source: string;
}

/**
 * 回答送信リクエスト
 */
export interface CreateAnswerRequest {
  questionId: string;
  userId: string;
  selectedAnswer: number;
}

/**
 * 学習進捗統計
 */
export interface LearningStats {
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  weakCategories: string[];
}

/**
 * 学習プラン
 */
export interface StudyPlan {
  id: string;
  userId: string;
  examDate: string;
  targetQuestionsPerDay: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 学習プラン作成リクエスト
 */
export interface CreateStudyPlanRequest {
  userId: string;
  examDate: string;
  targetQuestionsPerDay: number;
}

/**
 * 学習プラン更新リクエスト
 */
export interface UpdateStudyPlanRequest {
  examDate?: string;
  targetQuestionsPerDay?: number;
}

/**
 * 日別進捗
 */
export interface DailyGoalProgress {
  date: string;
  targetCount: number;
  actualCount: number;
  correctCount: number;
}

/**
 * 学習プランサマリー
 */
export interface StudyPlanSummary {
  daysRemaining: number;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  streak: number;
  dailyProgress: DailyGoalProgress[];
}

/**
 * カテゴリ別網羅率
 */
export interface CategoryCoverage {
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  coverageRate: number;
  accuracy: number;
}
