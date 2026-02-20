/**
 * APIクライアント共通ユーティリティ
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
export async function parseResponse<T>(response: Response): Promise<T | null> {
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`API error: ${response.status}`);
  }
  const json = await response.json();
  return transformKeys(json) as T;
}
