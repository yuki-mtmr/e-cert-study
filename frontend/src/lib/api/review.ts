/**
 * 復習関連API
 */
import type {
  ReviewItem,
  ReviewItemDetail,
  ReviewStats,
  BackfillResponse,
} from '@/types';
import { API_BASE_URL, parseResponse } from './client';

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
 * 復習アイテム詳細（問題内容・カテゴリ名付き）を取得
 */
export async function fetchReviewItemsDetailed(
  userId: string,
  status?: 'active' | 'mastered'
): Promise<ReviewItemDetail[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (status) {
    params.set('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/review/items/detailed?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await parseResponse<ReviewItemDetail[]>(response);
  return data || [];
}

/**
 * 過去の模試データから復習アイテムをバックフィル
 */
export async function triggerReviewBackfill(userId: string): Promise<BackfillResponse> {
  const response = await fetch(`${API_BASE_URL}/api/review/backfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const result = await parseResponse<BackfillResponse>(response);
  if (!result) {
    throw new Error('Failed to backfill review items');
  }
  return result;
}
