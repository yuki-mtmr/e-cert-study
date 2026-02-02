/**
 * PracticePageのテスト
 *
 * カテゴリ選択時の問題取得に関するテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PracticePage from '../page';

// モック設定
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@/hooks/useLocalProgress', () => ({
  useLocalProgress: () => ({
    userId: 'test-user-123',
    recordAnswer: vi.fn(),
  }),
}));

// APIモック
const mockFetchRandomQuestion = vi.fn();
const mockFetchSmartQuestion = vi.fn();
const mockFetchCategoriesTree = vi.fn();
const mockSubmitAnswer = vi.fn();

vi.mock('@/lib/api', () => ({
  fetchRandomQuestion: (...args: unknown[]) => mockFetchRandomQuestion(...args),
  fetchSmartQuestion: (...args: unknown[]) => mockFetchSmartQuestion(...args),
  fetchCategoriesTree: () => mockFetchCategoriesTree(),
  submitAnswer: (...args: unknown[]) => mockSubmitAnswer(...args),
}));

// サンプルデータ
const sampleQuestion = {
  id: 'q-1',
  content: 'テスト問題です',
  choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
  correctAnswer: 0,
  explanation: '解説テキスト',
  categoryId: 'cat-1',
};

const sampleCategories = [
  {
    id: 'cat-1',
    name: 'カテゴリ1',
    description: null,
    parentId: null,
    questionCount: 10,
    children: [],
  },
  {
    id: 'cat-2',
    name: 'カテゴリ2',
    description: null,
    parentId: null,
    questionCount: 5,
    children: [],
  },
];

// ヘルパー関数: 演習を開始する
const startPractice = async () => {
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /演習をスタート/i })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole('button', { name: /演習をスタート/i }));
};

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetchCategoriesTree.mockResolvedValue(sampleCategories);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('設定画面（setup mode）', () => {
    it('初期状態で設定画面が表示される', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      // 設定画面のタイトルが表示される
      await waitFor(() => {
        expect(screen.getByText('E資格 問題演習')).toBeInTheDocument();
      });

      // カテゴリ選択が表示される
      expect(screen.getByText('カテゴリを選択')).toBeInTheDocument();

      // 問題数選択が表示される
      expect(screen.getByText('問題数を選択')).toBeInTheDocument();

      // スタートボタンが表示される
      expect(screen.getByRole('button', { name: /演習をスタート/i })).toBeInTheDocument();
    });

    it('問題数を選択できる', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('問題数を選択')).toBeInTheDocument();
      });

      // ラジオボタンのラベルが表示される
      expect(screen.getByText('10問')).toBeInTheDocument();
      expect(screen.getByText('20問')).toBeInTheDocument();
      expect(screen.getByText('30問')).toBeInTheDocument();
      expect(screen.getByText('全問')).toBeInTheDocument();

      // デフォルトは10問（ラジオボタンをname属性で取得）
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
    });

    it('問題数選択を変更できる', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      await waitFor(() => {
        expect(screen.getByText('20問')).toBeInTheDocument();
      });

      // 20問のラベルをクリック
      const label20 = screen.getByText('20問');
      fireEvent.click(label20);

      const radios = screen.getAllByRole('radio');
      expect(radios[1]).toBeChecked();
    });

    it('スタートボタンをクリックすると演習が開始される', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      await startPractice();

      // 演習画面に切り替わる（問題が表示される）
      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      // 進捗が表示される
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  describe('演習中（active mode）', () => {
    it('進捗が正しく表示される', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      await startPractice();

      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      // 1/10問目
      expect(screen.getByText('1 / 10')).toBeInTheDocument();
    });
  });

  describe('カテゴリフィルタで問題が見つからない場合のフォールバック', () => {
    it('選択カテゴリに問題がない場合、フィルタなしで再取得する', async () => {
      // 有効なカテゴリIDを設定（存在するカテゴリを使用）
      localStorage.setItem(
        'selectedCategoryIds',
        JSON.stringify(['cat-1'])
      );

      // モック設定: カテゴリ指定時はnull、フィルタなし時はsampleQuestion
      mockFetchRandomQuestion.mockImplementation((categoryIds?: string[]) => {
        if (categoryIds && categoryIds.length > 0) {
          return Promise.resolve(null); // カテゴリ指定で問題なし
        }
        return Promise.resolve(sampleQuestion); // フィルタなしで問題あり
      });

      render(<PracticePage />);

      // 演習を開始（カテゴリが読み込まれてからボタンが有効になるのを待つ）
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /演習をスタート/i });
        expect(startButton).not.toBeDisabled();
      });
      fireEvent.click(screen.getByRole('button', { name: /演習をスタート/i }));

      // 問題が表示されることを確認（フォールバック成功）
      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      // fetchRandomQuestionが呼ばれたことを確認
      expect(mockFetchRandomQuestion).toHaveBeenCalled();
    });

    it('フォールバック後も問題がない場合はエラーメッセージを表示', async () => {
      // カテゴリフィルタありでもなしでも問題なし
      mockFetchRandomQuestion.mockResolvedValue(null);
      mockFetchSmartQuestion.mockResolvedValue(null);

      // 有効なカテゴリIDを設定（存在するカテゴリを使用）
      localStorage.setItem(
        'selectedCategoryIds',
        JSON.stringify(['cat-1'])
      );

      render(<PracticePage />);

      // 演習を開始（カテゴリが読み込まれてからボタンが有効になるのを待つ）
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /演習をスタート/i });
        expect(startButton).not.toBeDisabled();
      });
      fireEvent.click(screen.getByRole('button', { name: /演習をスタート/i }));

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(
          screen.getByText('問題が見つかりませんでした。問題をインポートしてください。')
        ).toBeInTheDocument();
      });
    });

    it('localStorageに無効な形式のデータがある場合はクリアして正常動作する', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);
      mockFetchSmartQuestion.mockResolvedValue(sampleQuestion);

      // 無効なJSON
      localStorage.setItem('selectedCategoryIds', 'invalid-json{{{');

      render(<PracticePage />);

      // 演習を開始
      await startPractice();

      // 問題が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });
    });
  });

  describe('正常系', () => {
    it('カテゴリ未選択の場合はスマート出題を使用', async () => {
      mockFetchSmartQuestion.mockResolvedValue(sampleQuestion);
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      render(<PracticePage />);

      // 演習を開始
      await startPractice();

      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      // スマート出題が呼ばれることを確認
      expect(mockFetchSmartQuestion).toHaveBeenCalledWith('test-user-123');
    });

    it('カテゴリ選択時はそのカテゴリから出題', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      // 有効なカテゴリIDを設定
      localStorage.setItem('selectedCategoryIds', JSON.stringify(['cat-1']));

      render(<PracticePage />);

      // 演習を開始
      await startPractice();

      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      // カテゴリ指定でrandomQuestionが呼ばれることを確認
      expect(mockFetchRandomQuestion).toHaveBeenCalledWith(['cat-1']);
    });

    it('複数カテゴリ選択時は配列で送信', async () => {
      mockFetchRandomQuestion.mockResolvedValue(sampleQuestion);

      localStorage.setItem('selectedCategoryIds', JSON.stringify(['cat-1', 'cat-2']));

      render(<PracticePage />);

      // 演習を開始
      await startPractice();

      await waitFor(() => {
        expect(screen.getByText('テスト問題です')).toBeInTheDocument();
      });

      expect(mockFetchRandomQuestion).toHaveBeenCalledWith(['cat-1', 'cat-2']);
    });
  });
});
