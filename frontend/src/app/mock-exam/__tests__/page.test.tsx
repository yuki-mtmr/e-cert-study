/**
 * 模試ページのナビゲーションテスト
 *
 * intro画面に履歴リンクが存在することを確認
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import MockExamPage from '../page';

// localStorageモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// fetchモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Next.js Linkモック
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('MockExamPage - ナビゲーション', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockFetch.mockReset();
    mockLocalStorage._setStore({
      'e-cert-study-user-id': 'test-user-123',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('intro画面に「過去の模試結果を見る」リンクがある', async () => {
    await act(async () => {
      render(<MockExamPage />);
    });

    const historyLink = screen.getByText('過去の模試結果を見る');
    expect(historyLink).toBeInTheDocument();
    expect(historyLink.closest('a')).toHaveAttribute('href', '/mock-exam/history');
  });
});
