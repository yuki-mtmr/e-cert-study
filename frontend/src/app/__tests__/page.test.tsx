/**
 * ホームページのナビゲーションテスト
 *
 * 模試履歴へのリンクが存在することを確認
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import Home from '../page';

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

// Next.js Linkモック
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('Home - ナビゲーション', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockLocalStorage._setStore({
      'e-cert-study-user-id': 'test-user-123',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('模擬試験カードの下に「過去の結果を見る」リンクがある', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('模擬試験')).toBeInTheDocument();
    });

    const historyLink = screen.getByText('過去の結果を見る');
    expect(historyLink).toBeInTheDocument();
    expect(historyLink.closest('a')).toHaveAttribute('href', '/mock-exam/history');
  });

  it('用語集カードが /glossary へリンクしている', async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('用語集')).toBeInTheDocument();
    });

    const glossaryLink = screen.getByText('用語集').closest('a');
    expect(glossaryLink).toHaveAttribute('href', '/glossary');
  });
});
