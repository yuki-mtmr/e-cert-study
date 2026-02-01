/**
 * 復習ページのテスト
 *
 * バグ: ホームで「18問の復習待ち」と表示されるのに、
 * 復習ページでは「復習する問題がありません」と表示される問題をテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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

  describe('回答処理', () => {
    const mockQuestion = {
      id: 'q1',
      content: 'テスト問題1',
      choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
      correct_answer: 0,
      category_id: 'cat1',
      content_type: 'plain',
      images: [],
      source: 'テスト',
      difficulty: 3,
      explanation: 'Aが正解です',
    };

    it('回答後に正解/不正解が表示される', async () => {
      // ローカルストレージに復習データを設定
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // APIモック: 問題を返す
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestion,
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      // 問題が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 選択肢Aをクリック
      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      // 回答するボタンをクリック
      const submitButton = screen.getByRole('button', { name: '回答する' });

      // submitAnswer APIをモック
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ isCorrect: true }),
      });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      // 結果が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 次の問題へボタンが表示される
      expect(screen.getByRole('button', { name: /復習を完了する/ })).toBeInTheDocument();
    });

    it('API失敗時もローカル判定で結果が表示される', async () => {
      // ローカルストレージに復習データを設定
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // APIモック: 問題を返す
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestion,
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      // 問題が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 選択肢Bをクリック（不正解を選択）
      const choiceB = screen.getByText(/B\./);
      await act(async () => {
        fireEvent.click(choiceB);
      });

      // submitAnswer APIをエラーにモック
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // 回答するボタンをクリック
      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // ローカル判定で結果が表示されることを確認（選択肢Bは不正解）
      await waitFor(() => {
        expect(screen.getByText('不正解')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('userIdがなくてもローカル判定で結果が表示される', async () => {
      // ローカルストレージに復習データを設定（userIdなし）
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        // 'e-cert-study-user-id' を設定しない
      });

      // APIモック: 問題を返す
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestion,
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      // 問題が表示されるまで待機
      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 選択肢Aをクリック（正解を選択）
      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      // 回答するボタンをクリック
      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // ローカル判定で結果が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('次の問題へボタンで次の問題に進める', async () => {
      // ローカルストレージに復習データを設定（2問）
      const progressData = createMockProgressData(['q1', 'q2']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // 1問目を返す
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestion,
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      // 1問目が表示される
      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
        expect(screen.getByText(/1 \/ 2 問/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // 選択肢Aをクリックして回答
      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ isCorrect: true }),
      });

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // 結果表示を待つ
      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 2問目のAPIモック
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockQuestion,
          id: 'q2',
          content: 'テスト問題2',
        }),
      });

      // 次の問題へボタンをクリック
      const nextButton = screen.getByRole('button', { name: /次の問題へ/ });
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // 2問目が表示される
      await waitFor(() => {
        expect(screen.getByText('テスト問題2')).toBeInTheDocument();
        expect(screen.getByText(/2 \/ 2 問/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('次の問題でQuestionCardの内部状態がリセットされる（key propテスト）', async () => {
      // ローカルストレージに復習データを設定（2問）
      const progressData = createMockProgressData(['q1', 'q2']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // 1問目を返す
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockQuestion,
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      // 1問目が表示される
      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 選択肢Aをクリックして回答
      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ isCorrect: true }),
      });

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // 結果表示を待つ
      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 2問目のAPIモック（異なる正解）
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ...mockQuestion,
          id: 'q2',
          content: 'テスト問題2',
          correct_answer: 2, // 正解はC
        }),
      });

      // 次の問題へボタンをクリック
      const nextButton = screen.getByRole('button', { name: /次の問題へ/ });
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // 2問目が表示される
      await waitFor(() => {
        expect(screen.getByText('テスト問題2')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 結果表示がリセットされていることを確認（正解/不正解が表示されていない）
      expect(screen.queryByText('正解!')).not.toBeInTheDocument();
      expect(screen.queryByText('不正解')).not.toBeInTheDocument();

      // 回答ボタンが再度表示されていることを確認（選択状態がリセットされている）
      expect(screen.getByRole('button', { name: '回答する' })).toBeInTheDocument();

      // 選択肢が選択されていない状態であることを確認
      // 回答ボタンがdisabledであれば、選択肢が選ばれていない
      const newSubmitButton = screen.getByRole('button', { name: '回答する' });
      expect(newSubmitButton).toBeDisabled();
    });
  });
});
