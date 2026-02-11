/**
 * 復習管理ダッシュボードのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import ReviewDashboardPage from '../page';

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

// テスト用のモックデータ
const mockActiveItems = [
  {
    id: 'item-1',
    question_id: 'q-1',
    user_id: 'test-user',
    correct_count: 3,
    status: 'active',
    first_wrong_at: '2025-01-01T00:00:00',
    last_answered_at: '2025-01-15T00:00:00',
    mastered_at: null,
    question_content: 'ニューラルネットワークの活性化関数について説明せよ',
    question_category_name: '深層学習の基礎',
  },
  {
    id: 'item-2',
    question_id: 'q-2',
    user_id: 'test-user',
    correct_count: 7,
    status: 'active',
    first_wrong_at: '2025-01-02T00:00:00',
    last_answered_at: '2025-01-16T00:00:00',
    mastered_at: null,
    question_content: '勾配降下法のバリエーションについて',
    question_category_name: '機械学習',
  },
];

const mockMasteredItems = [
  {
    id: 'item-3',
    question_id: 'q-3',
    user_id: 'test-user',
    correct_count: 10,
    status: 'mastered',
    first_wrong_at: '2025-01-01T00:00:00',
    last_answered_at: '2025-01-20T00:00:00',
    mastered_at: '2025-01-20T00:00:00',
    question_content: '線形回帰の最小二乗法について',
    question_category_name: '応用数学',
  },
];

const mockReviewStats = {
  active_count: 2,
  mastered_count: 1,
  total_count: 3,
};

/**
 * ダッシュボード用のfetchモックをセットアップ
 */
const setupMockFetch = () => {
  // 1回目: fetchReviewItemsDetailed (active)
  // 2回目: fetchReviewStats
  mockFetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockActiveItems,
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockReviewStats,
    });
};

describe('ReviewDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockFetch.mockReset();
    mockLocalStorage._setStore({
      'e-cert-study-user-id': 'test-user',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('統計カードが表示される（未習得数、習得済み数、習得率）', async () => {
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('2')).toBeInTheDocument(); // active_count
        expect(screen.getByText('1')).toBeInTheDocument(); // mastered_count
        expect(screen.getByText('3')).toBeInTheDocument(); // total_count
      },
      { timeout: 3000 }
    );
  });

  it('未習得タブのアイテム問題文が表示される', async () => {
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/ニューラルネットワークの活性化関数/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/勾配降下法のバリエーション/)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('各アイテムにカテゴリバッジが表示される', async () => {
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText('深層学習の基礎')).toBeInTheDocument();
        expect(screen.getByText('機械学習')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('習得済みタブに切り替えできる', async () => {
    // 初回: active items + stats
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    // 初回ロード完了を待つ
    await waitFor(
      () => {
        expect(screen.getByText(/ニューラルネットワーク/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // 習得済みタブのfetchモック（loadDataがitems+statsの2つを呼ぶ）
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockMasteredItems,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockReviewStats,
    });

    // 習得済みタブをクリック（タブにはカウントが含まれる）
    await act(async () => {
      fireEvent.click(screen.getByText(/習得済み \(/));
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/線形回帰の最小二乗法/)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('バックフィルボタンが動作する', async () => {
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/過去の模試データを取り込む/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // バックフィルAPIモック
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ exams_processed: 3, items_created: 5 }),
    });

    // リロード用のfetchモック
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockActiveItems,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReviewStats,
      });

    await act(async () => {
      fireEvent.click(screen.getByText(/過去の模試データを取り込む/));
    });

    await waitFor(
      () => {
        expect(screen.getByText(/3件の模試から5件の復習アイテム/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('アイテムが0件の場合に空状態が表示される', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          active_count: 0,
          mastered_count: 0,
          total_count: 0,
        }),
      });

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        expect(screen.getByText(/復習アイテムはありません/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('復習を開始するリンクが存在する', async () => {
    setupMockFetch();

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        const link = screen.getByText(/復習を開始する/);
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/review');
      },
      { timeout: 3000 }
    );
  });

  it('APIエラー時にローディングが止まりエラーメッセージが表示される', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        // ローディングスピナーが消えていること
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // エラーメッセージが表示されること
    expect(screen.getByText(/データの取得に失敗しました/)).toBeInTheDocument();
  });

  it('API 500エラー時にローディングが止まりエラーメッセージが表示される', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal server error' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal server error' }),
    });

    await act(async () => {
      render(<ReviewDashboardPage />);
    });

    await waitFor(
      () => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/データの取得に失敗しました/)).toBeInTheDocument();
  });
});
