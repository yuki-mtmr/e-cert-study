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

/**
 * 模試問題（正解・解説なし）
 */
export interface MockExamQuestion {
  questionIndex: number;
  questionId: string;
  content: string;
  choices: string[];
  contentType: ContentType;
  examArea: string;
  images: QuestionImage[];
}

/**
 * 模試開始レスポンス
 */
export interface MockExamStartResponse {
  examId: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  questions: MockExamQuestion[];
  startedAt: string;
}

/**
 * 模試回答リクエスト
 */
export interface MockExamAnswerRequest {
  questionIndex: number;
  selectedAnswer: number;
}

/**
 * 模試回答レスポンス
 */
export interface MockExamAnswerResponse {
  questionIndex: number;
  isCorrect: boolean;
}

/**
 * カテゴリ別スコア詳細
 */
export interface CategoryScoreDetail {
  areaName: string;
  total: number;
  correct: number;
  accuracy: number;
  grade: string;
}

/**
 * 模試結果
 */
export interface MockExamResult {
  examId: string;
  userId: string;
  startedAt: string;
  finishedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  score: number;
  passed: boolean | null;
  passingThreshold: number;
  categoryScores: CategoryScoreDetail[];
  analysis: string;
  aiAnalysis: string | null;
  status: string;
}

/**
 * 模試履歴アイテム
 */
export interface MockExamHistoryItem {
  examId: string;
  startedAt: string;
  finishedAt: string | null;
  score: number;
  passed: boolean | null;
  status: string;
}

/**
 * 復習アイテム
 */
export interface ReviewItem {
  id: string;
  questionId: string;
  userId: string;
  correctCount: number;
  status: 'active' | 'mastered';
  firstWrongAt: string;
  lastAnsweredAt: string;
  masteredAt: string | null;
}

/**
 * 復習アイテム詳細（問題内容・カテゴリ名付き）
 */
export interface ReviewItemDetail extends ReviewItem {
  questionContent: string;
  questionCategoryName: string | null;
}

/**
 * バックフィルレスポンス
 */
export interface BackfillResponse {
  examsProcessed: number;
  itemsCreated: number;
}

/**
 * 復習統計
 */
export interface ReviewStats {
  activeCount: number;
  masteredCount: number;
  totalCount: number;
}

/**
 * チャットメッセージ
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
