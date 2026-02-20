/**
 * カテゴリ関連API
 */
import type { Category, CategoryTree } from '@/types';
import { API_BASE_URL, parseResponse } from './client';

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
