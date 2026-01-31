/**
 * Supabaseサーバークライアントのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// createServerClient のモック
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

// Next.js cookies のモック
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe('Supabase Server Client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should create a server client', async () => {
    const { createClient } = await import('../server');
    const client = await createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should have auth methods for server', async () => {
    const { createClient } = await import('../server');
    const client = await createClient();
    expect(client.auth.getSession).toBeDefined();
    expect(client.auth.getUser).toBeDefined();
  });
});
