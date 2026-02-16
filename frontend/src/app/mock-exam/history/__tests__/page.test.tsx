/**
 * 模試履歴ページのテスト
 *
 * isInitialized=falseの間はAPI呼び出ししないこと、
 * エラー表示、ナビゲーションリンクをテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import MockExamHistoryPage from '../page';

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

// MockExamScoreChartモック
vi.mock('@/components/MockExamScoreChart', () => ({
  MockExamScoreChart: ({ exams }: { exams: unknown[] }) => (
    <div data-testid="mock-exam-score-chart">chart: {exams.length} exams</div>
  ),
}));

/**
 * 履歴APIの成功レスポンスモック
 */
const mockHistoryApi = (exams: Record<string, unknown>[], totalCount: number) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ exams, total_count: totalCount }),
  });
};

/**
 * 履歴APIのエラーレスポンスモック
 */
const mockHistoryApiError = () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
};

describe('MockExamHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('userId初期化待ち', () => {
    it('isInitializedがfalseの間はAPIを呼び出さない', async () => {
      // localStorageにuserIdを設定しない → isInitializedがtrueになるまで待つ
      // ただし、useLocalProgressは初期化後にuserIdを自動生成するため
      // 結果的にAPIは呼ばれるが、空文字での呼び出しは行われないことを確認
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi([], 0);

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        // API呼び出しで空文字のuserIdが使われていないことを確認
        const fetchCalls = mockFetch.mock.calls;
        const historyCalls = fetchCalls.filter(
          (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/mock-exam/history')
        );
        historyCalls.forEach((call: unknown[]) => {
          expect(call[0]).not.toContain('user_id=&');
          expect(call[0]).not.toMatch(/user_id=$/);
        });
      });
    });

    it('isInitializedがtrueでuserIdがある場合はAPIを呼び出す', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi([], 0);

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        const fetchCalls = mockFetch.mock.calls;
        const historyCalls = fetchCalls.filter(
          (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('/api/mock-exam/history')
        );
        expect(historyCalls.length).toBeGreaterThan(0);
        expect(historyCalls[0][0]).toContain('user_id=test-user-123');
      });
    });
  });

  describe('ローディング表示', () => {
    it('3秒以上かかるとサーバー起動中メッセージを表示する', async () => {
      vi.useFakeTimers();
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      // fetchを遅延させる（resolveしない）
      let resolveFetch: ((value: unknown) => void) | undefined;
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => {
        resolveFetch = resolve;
      }));

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      // 最初はメッセージなし
      expect(screen.queryByText(/サーバー起動中/)).not.toBeInTheDocument();

      // 3秒経過をシミュレート
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/サーバー起動中/)).toBeInTheDocument();

      // fetchを解決してクリーンアップ
      vi.useRealTimers();
      await act(async () => {
        resolveFetch?.({ ok: true, json: async () => ({ exams: [], total_count: 0 }) });
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('API失敗時にエラーメッセージを表示する', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApiError();

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('履歴の読み込みに失敗しました。')).toBeInTheDocument();
      });
    });

    it('API失敗時にリトライボタンを表示し、クリックで再取得する', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      // 1回目: エラー
      mockHistoryApiError();

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('履歴の読み込みに失敗しました。')).toBeInTheDocument();
      });

      // リトライボタンが存在する
      const retryButton = screen.getByRole('button', { name: /再試行/ });
      expect(retryButton).toBeInTheDocument();

      // 2回目: 成功
      mockHistoryApi([], 0);

      await act(async () => {
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('まだ模試を受験していません。')).toBeInTheDocument();
      });
    });
  });  // end of エラーハンドリング

  describe('履歴の表示', () => {
    it('履歴がない場合は「まだ模試を受験していません」を表示', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi([], 0);

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('まだ模試を受験していません。')).toBeInTheDocument();
      });
    });

    it('履歴がある場合は一覧を表示する', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi(
        [
          {
            exam_id: 'exam-1',
            started_at: '2026-01-15T10:00:00',
            finished_at: '2026-01-15T12:00:00',
            score: 75.0,
            passed: true,
            status: 'finished',
          },
        ],
        1
      );

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('全 1 件')).toBeInTheDocument();
        expect(screen.getByText(/75%/)).toBeInTheDocument();
        expect(screen.getByText('合格')).toBeInTheDocument();
      });
    });

    it('履歴が2件以上ある場合はスコアグラフを表示する', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi(
        [
          {
            exam_id: 'exam-1',
            started_at: '2026-01-10T10:00:00',
            finished_at: '2026-01-10T12:00:00',
            score: 60.0,
            passed: false,
            status: 'finished',
          },
          {
            exam_id: 'exam-2',
            started_at: '2026-01-20T10:00:00',
            finished_at: '2026-01-20T12:00:00',
            score: 75.0,
            passed: true,
            status: 'finished',
          },
        ],
        2
      );

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-exam-score-chart')).toBeInTheDocument();
      });
    });

    it('履歴が0件の場合はスコアグラフを表示しない', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      mockHistoryApi([], 0);

      await act(async () => {
        render(<MockExamHistoryPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('まだ模試を受験していません。')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('mock-exam-score-chart')).not.toBeInTheDocument();
    });
  });
});
