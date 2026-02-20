/**
 * 問題関連API
 */
import type { Question } from '@/types';
import { API_BASE_URL, parseResponse } from './client';

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
      if (categoryIdOrIds.length > 0) {
        params.set('category_ids', categoryIdOrIds.join(','));
      }
    } else {
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
