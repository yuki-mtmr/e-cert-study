/**
 * 模試関連API
 */
import type {
  MockExamStartResponse,
  MockExamAnswerRequest,
  MockExamAnswerResponse,
  MockExamResult,
  MockExamHistoryItem,
} from '@/types';
import { API_BASE_URL, parseResponse } from './client';

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/mock-exam/history?user_id=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const data = await parseResponse<{ exams: MockExamHistoryItem[]; totalCount: number }>(response);
    return data || { exams: [], totalCount: 0 };
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
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
