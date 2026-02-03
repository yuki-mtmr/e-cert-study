/**
 * 統計ページのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StatsPage from '../page';

// モックの設定
vi.mock('@/hooks/useLocalProgress', () => ({
  useLocalProgress: () => ({
    userId: 'test-user-123',
    stats: {
      totalAnswered: 10,
      correctCount: 8,
      incorrectCount: 2,
      accuracy: 80,
    },
  }),
}));

const mockOverview = {
  totalAnswered: 100,
  correctCount: 75,
  incorrectCount: 25,
  accuracy: 75.0,
};

const mockWeakAreas = [
  {
    categoryId: '1',
    categoryName: '強化学習',
    totalAnswered: 20,
    correctCount: 5,
    accuracy: 25.0,
  },
];

const mockProgress = [
  { date: '2024-01-01', answered: 10, correct: 8 },
  { date: '2024-01-02', answered: 15, correct: 12 },
];

const mockCategoryCoverage = [
  {
    categoryId: '1',
    categoryName: '応用数学',
    totalQuestions: 50,
    answeredCount: 30,
    correctCount: 25,
    coverageRate: 60.0,
    accuracy: 83.3,
  },
  {
    categoryId: '2',
    categoryName: '機械学習',
    totalQuestions: 40,
    answeredCount: 20,
    correctCount: 15,
    coverageRate: 50.0,
    accuracy: 75.0,
  },
  {
    categoryId: '3',
    categoryName: '深層学習',
    totalQuestions: 60,
    answeredCount: 0,
    correctCount: 0,
    coverageRate: 0.0,
    accuracy: 0.0,
  },
];

vi.mock('@/lib/api', () => ({
  fetchOverviewStats: vi.fn(),
  fetchWeakAreas: vi.fn(),
  fetchDailyProgress: vi.fn(),
  fetchCategoryCoverage: vi.fn(),
}));

import {
  fetchOverviewStats,
  fetchWeakAreas,
  fetchDailyProgress,
  fetchCategoryCoverage,
} from '@/lib/api';

describe('StatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchOverviewStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverview);
    (fetchWeakAreas as ReturnType<typeof vi.fn>).mockResolvedValue(mockWeakAreas);
    (fetchDailyProgress as ReturnType<typeof vi.fn>).mockResolvedValue(mockProgress);
    (fetchCategoryCoverage as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategoryCoverage);
  });

  it('ページタイトルが表示される', async () => {
    render(<StatsPage />);

    await waitFor(() => {
      expect(screen.getByText('分析ダッシュボード')).toBeInTheDocument();
    });
  });

  it('学習概要セクションが表示される', async () => {
    render(<StatsPage />);

    await waitFor(() => {
      expect(screen.getByText('学習概要')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // totalAnswered
      expect(screen.getByText('75')).toBeInTheDocument(); // correctCount
    });
  });

  describe('カテゴリ別網羅率セクション', () => {
    it('網羅率セクションが表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText(/カテゴリ別.*網羅率|網羅率/i)).toBeInTheDocument();
      });
    });

    it('各カテゴリの網羅率が表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        // カテゴリ名
        expect(screen.getByText('応用数学')).toBeInTheDocument();
        expect(screen.getByText('機械学習')).toBeInTheDocument();
        expect(screen.getByText('深層学習')).toBeInTheDocument();
      });
    });

    it('網羅率が進捗バーとパーセントで表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        // 網羅率のパーセント表示
        expect(screen.getByText(/60.*%/)).toBeInTheDocument();
        expect(screen.getByText(/50.*%/)).toBeInTheDocument();
      });
    });

    it('問題数（回答済/総数）が表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        // 「30/50問」のような形式
        expect(screen.getByText(/30.*\/.*50問/)).toBeInTheDocument();
        expect(screen.getByText(/20.*\/.*40問/)).toBeInTheDocument();
        expect(screen.getByText(/0.*\/.*60問/)).toBeInTheDocument();
      });
    });

    it('正答率が表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        // 正答率が「正答率: xx.x%」の形式で表示される
        expect(screen.getByText(/正答率.*83\.3/)).toBeInTheDocument();
        expect(screen.getByText(/正答率.*75/)).toBeInTheDocument();
      });
    });

    it('fetchCategoryCoverageがuserIdで呼ばれる', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(fetchCategoryCoverage).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('網羅率0%のカテゴリも表示される', async () => {
      render(<StatsPage />);

      await waitFor(() => {
        expect(screen.getByText('深層学習')).toBeInTheDocument();
        // 0%を何らかの形で表示
        const deepLearningSection = screen.getByText('深層学習').closest('div');
        expect(deepLearningSection).toBeInTheDocument();
      });
    });
  });

  it('APIエラー時はローカルデータを使用する', async () => {
    (fetchOverviewStats as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (fetchCategoryCoverage as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<StatsPage />);

    await waitFor(() => {
      // ローカルデータの値が表示される
      expect(screen.getByText('10')).toBeInTheDocument(); // localStats.totalAnswered
    });
  });
});
