/**
 * APIクライアント
 */
import type {
  Question,
  Category,
  CategoryTree,
  Answer,
  CreateAnswerRequest,
  LearningStats,
  StudyPlan,
  CreateStudyPlanRequest,
  UpdateStudyPlanRequest,
  StudyPlanSummary,
  MockExamStartResponse,
  MockExamAnswerRequest,
  MockExamAnswerResponse,
  MockExamResult,
  MockExamHistoryItem,
  ReviewItem,
  ReviewStats,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * snake_caseをcamelCaseに変換
 * @param str - snake_case文字列
 * @returns camelCase文字列
 */
export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * オブジェクトのキーをsnake_caseからcamelCaseに再帰的に変換
 * @param data - 変換対象のデータ
 * @returns camelCaseに変換されたデータ
 */
export function transformKeys<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(transformKeys) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = snakeToCamelCase(key);
      result[camelKey] = transformKeys(value);
    }
    return result as T;
  }

  return data;
}

/**
 * APIレスポンスをパースするヘルパー
 * snake_caseをcamelCaseに変換する
 */
async function parseResponse<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`API error: ${response.status}`);
  }
  const json = await response.json();
  return transformKeys(json) as T;
}

/**
 * 問題一覧を取得
 */
export async function fetchQuestions(options?: {
  categoryId?: string;
  limit?: number;
}): Promise<Question[]> {
  const params = new URLSearchParams();
  if (options?.categoryId) {
    params.set('category_id', options.categoryId);
  }
  if (options?.limit) {
    params.set('limit', options.limit.toString());
  }

  const url = `${API_BASE_URL}/api/questions${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<Question[]>(response);
  return data || [];
}

/**
 * IDで問題を取得
 */
export async function fetchQuestionById(id: string): Promise<Question | null> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<Question>(response);
}

/**
 * ランダムな問題を取得
 *
 * @param categoryIdOrIds - 単一のカテゴリID（文字列）または複数のカテゴリID（配列）
 */
export async function fetchRandomQuestion(
  categoryIdOrIds?: string | string[]
): Promise<Question | null> {
  const params = new URLSearchParams();

  if (categoryIdOrIds) {
    if (Array.isArray(categoryIdOrIds)) {
      // 配列の場合：複数カテゴリを指定
      if (categoryIdOrIds.length > 0) {
        params.set('category_ids', categoryIdOrIds.join(','));
      }
    } else {
      // 文字列の場合：単一カテゴリを指定（後方互換性）
      params.set('category_id', categoryIdOrIds);
    }
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/questions/random${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<Question>(response);
}

/**
 * 苦手分野優先でスマートに問題を取得
 */
export async function fetchSmartQuestion(userId: string): Promise<Question | null> {
  const response = await fetch(`${API_BASE_URL}/api/questions/smart?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<Question>(response);
}

/**
 * 回答を送信
 * 5秒のタイムアウトを設定
 */
export async function submitAnswer(data: CreateAnswerRequest): Promise<Answer> {
  // 5秒タイムアウト
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: data.questionId,
        user_id: data.userId,
        selected_answer: data.selectedAnswer,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const result = await parseResponse<Answer>(response);
    if (!result) {
      throw new Error('Failed to submit answer');
    }
    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<Category[]>(response);
  return data || [];
}

/**
 * カテゴリツリーを取得（階層構造）
 */
export async function fetchCategoriesTree(): Promise<CategoryTree[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories/tree`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<CategoryTree[]>(response);
  return data || [];
}

/**
 * 回答履歴を取得
 */
export async function fetchAnswerHistory(userId: string, limit?: number): Promise<Answer[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (limit) {
    params.set('limit', limit.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/answers/history?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<Answer[]>(response);
  return data || [];
}

/**
 * 学習概要統計を取得
 */
export interface OverviewStats {
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

export async function fetchOverviewStats(userId: string): Promise<OverviewStats | null> {
  const response = await fetch(`${API_BASE_URL}/api/stats/overview?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<OverviewStats>(response);
}

/**
 * 苦手分野を取得
 */
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
}

export async function fetchWeakAreas(userId: string, limit?: number): Promise<CategoryStats[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (limit) {
    params.set('limit', limit.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/stats/weak-areas?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<CategoryStats[]>(response);
  return data || [];
}

/**
 * 日別進捗を取得
 */
export interface DailyProgress {
  date: string;
  answered: number;
  correct: number;
}

export async function fetchDailyProgress(userId: string, days?: number): Promise<DailyProgress[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (days) {
    params.set('days', days.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/stats/progress?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<DailyProgress[]>(response);
  return data || [];
}

/**
 * 学習プランを取得
 */
export async function fetchStudyPlan(userId: string): Promise<StudyPlan | null> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<StudyPlan>(response);
}

/**
 * 学習プランを作成
 */
export async function createStudyPlan(data: CreateStudyPlanRequest): Promise<StudyPlan> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: data.userId,
      exam_date: data.examDate,
      target_questions_per_day: data.targetQuestionsPerDay,
    }),
  });

  const result = await parseResponse<StudyPlan>(response);
  if (!result) {
    throw new Error('Failed to create study plan');
  }
  return result;
}

/**
 * 学習プランを更新
 */
export async function updateStudyPlan(
  userId: string,
  data: UpdateStudyPlanRequest
): Promise<StudyPlan> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan?user_id=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_date: data.examDate,
      target_questions_per_day: data.targetQuestionsPerDay,
    }),
  });

  const result = await parseResponse<StudyPlan>(response);
  if (!result) {
    throw new Error('Failed to update study plan');
  }
  return result;
}

/**
 * 学習プランを削除
 */
export async function deleteStudyPlan(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan?user_id=${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to delete study plan');
  }
}

/**
 * 学習プランサマリーを取得
 */
export async function fetchStudyPlanSummary(userId: string): Promise<StudyPlanSummary | null> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan/summary?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<StudyPlanSummary>(response);
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
 * カテゴリ別網羅率を取得
 */
export async function fetchCategoryCoverage(userId: string): Promise<CategoryCoverage[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/stats/category-coverage?user_id=${userId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const data = await parseResponse<CategoryCoverage[]>(response);
  return data || [];
}

/**
 * 模試を開始
 */
export async function startMockExam(userId: string): Promise<MockExamStartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/mock-exam/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const result = await parseResponse<MockExamStartResponse>(response);
  if (!result) {
    throw new Error('Failed to start mock exam');
  }
  return result;
}

/**
 * 模試の回答を送信
 */
export async function submitMockExamAnswer(
  examId: string,
  data: MockExamAnswerRequest
): Promise<MockExamAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/mock-exam/${examId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question_index: data.questionIndex,
      selected_answer: data.selectedAnswer,
    }),
  });

  const result = await parseResponse<MockExamAnswerResponse>(response);
  if (!result) {
    throw new Error('Failed to submit answer');
  }
  return result;
}

/**
 * 模試を終了
 */
export async function finishMockExam(examId: string, userId: string): Promise<MockExamResult> {
  const response = await fetch(`${API_BASE_URL}/api/mock-exam/${examId}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const result = await parseResponse<MockExamResult>(response);
  if (!result) {
    throw new Error('Failed to finish mock exam');
  }
  return result;
}

/**
 * 模試結果を取得
 */
export async function fetchMockExamResult(examId: string): Promise<MockExamResult | null> {
  const response = await fetch(`${API_BASE_URL}/api/mock-exam/${examId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<MockExamResult>(response);
}

/**
 * 模試履歴を取得
 */
export async function fetchMockExamHistory(
  userId: string
): Promise<{ exams: MockExamHistoryItem[]; totalCount: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/mock-exam/history?user_id=${userId}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const data = await parseResponse<{ exams: MockExamHistoryItem[]; totalCount: number }>(response);
  return data || { exams: [], totalCount: 0 };
}

/**
 * 復習アイテム（active）を取得
 */
export async function fetchReviewItems(userId: string): Promise<ReviewItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/review/items?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<ReviewItem[]>(response);
  return data || [];
}

/**
 * 習得済みアイテムを取得
 */
export async function fetchMasteredItems(userId: string): Promise<ReviewItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/review/mastered?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<ReviewItem[]>(response);
  return data || [];
}

/**
 * 復習統計を取得
 */
export async function fetchReviewStats(userId: string): Promise<ReviewStats | null> {
  const response = await fetch(`${API_BASE_URL}/api/review/stats?user_id=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  return parseResponse<ReviewStats>(response);
}

/**
 * AI分析を生成
 */
export async function requestAIAnalysis(
  examId: string,
  userId: string
): Promise<{ examId: string; aiAnalysis: string }> {
  const response = await fetch(`${API_BASE_URL}/api/mock-exam/${examId}/ai-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const result = await parseResponse<{ examId: string; aiAnalysis: string }>(response);
  if (!result) {
    throw new Error('Failed to generate AI analysis');
  }
  return result;
}
