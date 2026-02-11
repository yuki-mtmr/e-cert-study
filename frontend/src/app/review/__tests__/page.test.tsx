/**
 * 復習ページのテスト
 *
 * バックエンドAPI優先、localStorageフォールバックの動作をテスト
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

/**
 * review APIを空レスポンスで返すモック（localStorageフォールバック用）
 */
const mockEmptyReviewApi = () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => [],
  });
};

/**
 * 問題取得APIのモックレスポンスを返す
 */
const mockQuestionApi = (question: Record<string, unknown>) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => question,
  });
};

/**
 * 回答送信APIのモックレスポンスを返す
 */
const mockSubmitAnswerApi = (isCorrect: boolean) => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ isCorrect }),
  });
};

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorageフォールバック', () => {
    it('localStorageに復習対象があれば問題を表示する', async () => {
      const progressData = createMockProgressData(['q1', 'q2', 'q3']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // review API: 空（localStorageフォールバック）
      mockEmptyReviewApi();
      // 問題取得API
      mockQuestionApi({
        id: 'q1',
        content: 'テスト問題1',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 0,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.queryByText('復習する問題がありません。問題演習を行ってください。')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 3 問/)).toBeInTheDocument();
      });
    });

    it('localStorageが空なら「復習する問題がありません」を表示', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      // review API: 空
      mockEmptyReviewApi();

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('復習する問題がありません。問題演習を行ってください。')).toBeInTheDocument();
      });
    });

    it('全問正解ならば「復習する問題がありません」を表示', async () => {
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

      // review API: 空
      mockEmptyReviewApi();

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('復習する問題がありません。問題演習を行ってください。')).toBeInTheDocument();
      });
    });

    it('一度間違えて後で正解した問題は復習対象外', async () => {
      const progressData = {
        answers: [
          { questionId: 'q1', isCorrect: false },
          { questionId: 'q2', isCorrect: false },
          { questionId: 'q1', isCorrect: true },
        ],
      };
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // review API: 空（localStorageフォールバック）
      mockEmptyReviewApi();
      // 問題取得API
      mockQuestionApi({
        id: 'q2',
        content: 'テスト問題2',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 1,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 1 問/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('バックエンドAPI優先', () => {
    it('バックエンドAPIから復習アイテムを取得して表示する', async () => {
      mockLocalStorage._setStore({
        'e-cert-study-user-id': 'test-user-123',
      });

      // review API: アイテムあり
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          {
            id: 'ri1',
            question_id: 'q1',
            user_id: 'test-user-123',
            correct_count: 3,
            status: 'active',
            first_wrong_at: '2026-01-01T00:00:00',
            last_answered_at: '2026-01-02T00:00:00',
            mastered_at: null,
          },
        ]),
      });

      // 問題取得API
      mockQuestionApi({
        id: 'q1',
        content: 'API復習問題',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 0,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 1 問/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // 習得進捗バーが表示される
      await waitFor(() => {
        expect(screen.getByText('3 / 3')).toBeInTheDocument();
      });
    });

    it('バックエンドAPI失敗時はlocalStorageフォールバック', async () => {
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      // review API: 失敗
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // 問題取得API
      mockQuestionApi({
        id: 'q1',
        content: 'フォールバック問題',
        choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
        correct_answer: 0,
        category_id: 'cat1',
        content_type: 'plain',
        images: [],
      });

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 \/ 1 問/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
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
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      mockEmptyReviewApi();
      mockQuestionApi(mockQuestion);

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      const submitButton = screen.getByRole('button', { name: '回答する' });
      mockSubmitAnswerApi(true);

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByRole('button', { name: /復習を完了する/ })).toBeInTheDocument();
    });

    it('API失敗時もローカル判定で結果が表示される', async () => {
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      mockEmptyReviewApi();
      mockQuestionApi(mockQuestion);

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const choiceB = screen.getByText(/B\./);
      await act(async () => {
        fireEvent.click(choiceB);
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('不正解')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('userIdがなくてもローカル判定で結果が表示される', async () => {
      const progressData = createMockProgressData(['q1']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
      });

      // userIdは自動生成されるのでreview APIも呼ばれる
      mockEmptyReviewApi();
      mockQuestionApi(mockQuestion);

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('次の問題へボタンで次の問題に進める', async () => {
      const progressData = createMockProgressData(['q1', 'q2']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      mockEmptyReviewApi();
      mockQuestionApi(mockQuestion);

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
        expect(screen.getByText(/1 \/ 2 問/)).toBeInTheDocument();
      }, { timeout: 3000 });

      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      mockSubmitAnswerApi(true);

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 2問目のAPI
      mockQuestionApi({
        ...mockQuestion,
        id: 'q2',
        content: 'テスト問題2',
      });

      const nextButton = screen.getByRole('button', { name: /次の問題へ/ });
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題2')).toBeInTheDocument();
        expect(screen.getByText(/2 \/ 2 問/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('次の問題でQuestionCardの内部状態がリセットされる', async () => {
      const progressData = createMockProgressData(['q1', 'q2']);
      mockLocalStorage._setStore({
        'e-cert-study-progress': JSON.stringify(progressData),
        'e-cert-study-user-id': 'test-user-123',
      });

      mockEmptyReviewApi();
      mockQuestionApi(mockQuestion);

      await act(async () => {
        render(<ReviewPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題1')).toBeInTheDocument();
      }, { timeout: 3000 });

      const choiceA = screen.getByText(/A\./);
      await act(async () => {
        fireEvent.click(choiceA);
      });

      mockSubmitAnswerApi(true);

      const submitButton = screen.getByRole('button', { name: '回答する' });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('正解!')).toBeInTheDocument();
      }, { timeout: 3000 });

      mockQuestionApi({
        ...mockQuestion,
        id: 'q2',
        content: 'テスト問題2',
        correct_answer: 2,
      });

      const nextButton = screen.getByRole('button', { name: /次の問題へ/ });
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('テスト問題2')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.queryByText('正解!')).not.toBeInTheDocument();
      expect(screen.queryByText('不正解')).not.toBeInTheDocument();

      expect(screen.getByRole('button', { name: '回答する' })).toBeInTheDocument();
      const newSubmitButton = screen.getByRole('button', { name: '回答する' });
      expect(newSubmitButton).toBeDisabled();
    });
  });
});
