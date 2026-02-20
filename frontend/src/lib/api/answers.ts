/**
 * 回答関連API
 */
import type { Answer, CreateAnswerRequest } from '@/types';
import { API_BASE_URL, parseResponse } from './client';

/**
 * 回答を送信
 * 5秒のタイムアウトを設定
 */
export async function submitAnswer(data: CreateAnswerRequest): Promise<Answer> {
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
