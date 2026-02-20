/**
 * 統計関連API
 */
import { API_BASE_URL, parseResponse } from './client';

/**
 * 学習概要統計
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
 * 苦手分野統計
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
 * 日別進捗
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
