/**
 * Supabase ブラウザクライアント
 *
 * クライアントサイドで使用するSupabaseクライアント
 */
import { createBrowserClient } from '@supabase/ssr';

/**
 * ブラウザ用Supabaseクライアントを作成
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
