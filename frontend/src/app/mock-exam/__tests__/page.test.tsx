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

describe('MockExamPage - トピック表示', () => {
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

  it('アクティブフェーズでtopicバッジが表示される', async () => {
    // 模試開始レスポンスをモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        examId: 'exam-1',
        totalQuestions: 1,
        timeLimitMinutes: 120,
        questions: [
          {
            questionIndex: 0,
            questionId: 'q-1',
            content: 'テスト問題',
            choices: ['A', 'B', 'C', 'D'],
            contentType: 'plain',
            examArea: '応用数学',
            topic: 'ベイズ則',
            images: [],
          },
        ],
        startedAt: new Date().toISOString(),
      }),
    });

    await act(async () => {
      render(<MockExamPage />);
    });

    // 模試開始ボタンをクリック
    const startButton = screen.getByText('模試を開始する');
    await act(async () => {
      startButton.click();
    });

    // topicバッジが表示される
    expect(screen.getByText('ベイズ則')).toBeInTheDocument();
  });
});

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
