/**
 * Supabaseクライアントのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// createBrowserClient のモック
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.resetModules();
    // 環境変数をモック
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create a browser client', async () => {
    const { createClient } = await import('../client');
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should have auth methods', async () => {
    const { createClient } = await import('../client');
    const client = createClient();
    expect(client.auth.getSession).toBeDefined();
    expect(client.auth.signInWithPassword).toBeDefined();
    expect(client.auth.signOut).toBeDefined();
  });
});
