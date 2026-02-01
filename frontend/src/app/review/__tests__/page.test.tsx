/**
 * 復習ページのテスト
 *
 * バグ: ホームで「18問の復習待ち」と表示されるのに、
 * 復習ページでは「復習する問題がありません」と表示される問題をテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import ReviewPage from '../page';

// モック用のストレージデータ
const createMockProgressData = (incorrectIds: string[]) => ({
  answers: incorrectIds.map(id => ({ questionId: id, isCorrect: false })),
});

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
    _getStore: () => store,
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

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('localStorageに復習対象があれば問題を表示する', async () => {
    // ローカルストレージに復習データを設定
    const progressData = createMockProgressData(['q1', 'q2', 'q3']);
    mockLocalStorage._setStore({
      'e-cert-study-progress': JSON.stringify(progressData),
      'e-cert-study-user-id': 'test-user-123',
    });

    // APIモック: 問題を返す
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'q1',
        content: 'テスト問題1',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 0,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      }),
    });

    await act(async () => {
      render(<ReviewPage />);
    });

    // 問題が表示されることを確認（エラーメッセージが表示されないこと）
    await waitFor(() => {
      expect(screen.queryByText('復習する問題がありません。問題演習を行ってください。')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // 進捗表示があること
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 3 問/)).toBeInTheDocument();
    });
  });

  it('localStorageが空なら「復習する問題がありません」を表示', async () => {
    // ローカルストレージは空（ユーザーIDのみ）
    mockLocalStorage._setStore({
      'e-cert-study-user-id': 'test-user-123',
    });

    await act(async () => {
      render(<ReviewPage />);
    });

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('復習する問題がありません。問題演習を行ってください。')).toBeInTheDocument();
    });
  });

  it('全問正解ならば「復習する問題がありません」を表示', async () => {
    // 全て正解のデータ
    const progressData = {
      answers: [
        { questionId: 'q1', isCorrect: true },
        { questionId: 'q2', isCorrect: true },
      ],
    };
    mockLocalStorage._setStore({
      'e-cert-study-progress': JSON.stringify(progressData),
      'e-cert-study-user-id': 'test-user-123',
    });

    await act(async () => {
      render(<ReviewPage />);
    });

    // 復習問題がないメッセージ
    await waitFor(() => {
      expect(screen.getByText('復習する問題がありません。問題演習を行ってください。')).toBeInTheDocument();
    });
  });

  it('一度間違えて後で正解した問題は復習対象外', async () => {
    // q1は間違えた後に正解したので復習対象外
    const progressData = {
      answers: [
        { questionId: 'q1', isCorrect: false },
        { questionId: 'q2', isCorrect: false },
        { questionId: 'q1', isCorrect: true }, // q1は後で正解
      ],
    };
    mockLocalStorage._setStore({
      'e-cert-study-progress': JSON.stringify(progressData),
      'e-cert-study-user-id': 'test-user-123',
    });

    // APIモック: q2の問題を返す
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'q2',
        content: 'テスト問題2',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 1,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      }),
    });

    await act(async () => {
      render(<ReviewPage />);
    });

    // q2だけが復習対象なので「1 / 1 問」と表示
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 1 問/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
