/**
 * APIクライアント
 */
import type {
  Question,
  Category,
  Answer,
  CreateAnswerRequest,
  LearningStats,
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
 */
export async function fetchRandomQuestion(categoryId?: string): Promise<Question | null> {
  const params = categoryId ? `?category_id=${categoryId}` : '';
  const response = await fetch(`${API_BASE_URL}/api/questions/random${params}`, {
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
