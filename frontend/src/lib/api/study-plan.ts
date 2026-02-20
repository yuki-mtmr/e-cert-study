/**
 * 学習プラン関連API
 */
import type {
  StudyPlan,
  CreateStudyPlanRequest,
  UpdateStudyPlanRequest,
  StudyPlanSummary,
} from '@/types';
import { API_BASE_URL, parseResponse } from './client';

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
