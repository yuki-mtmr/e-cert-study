/**
 * 学習プランページのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudyPlanPage from '../page';
import * as api from '@/lib/api';
import type { StudyPlan, StudyPlanSummary } from '@/types';

// APIモック
vi.mock('@/lib/api', () => ({
  fetchStudyPlan: vi.fn(),
  createStudyPlan: vi.fn(),
  updateStudyPlan: vi.fn(),
  deleteStudyPlan: vi.fn(),
  fetchStudyPlanSummary: vi.fn(),
}));

// useLocalProgressモック
vi.mock('@/hooks/useLocalProgress', () => ({
  useLocalProgress: () => ({
    userId: 'test_user_123',
    stats: { totalAnswered: 0, correctCount: 0, incorrectCount: 0, accuracy: 0 },
  }),
}));

// rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const mockStudyPlan: StudyPlan = {
  id: '1',
  userId: 'test_user_123',
  examDate: '2026-03-15',
  targetQuestionsPerDay: 20,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockSummary: StudyPlanSummary = {
  daysRemaining: 40,
  totalAnswered: 100,
  totalCorrect: 80,
  accuracy: 80.0,
  streak: 5,
  dailyProgress: [
    {
      date: '2026-02-01',
      targetCount: 20,
      actualCount: 22,
      correctCount: 18,
    },
  ],
};

describe('StudyPlanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // confirmをモック
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('ページタイトルを表示する', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(null);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /学習プラン/ })).toBeInTheDocument();
    });
  });

  it('学習プランがない場合は作成フォームを表示する', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(null);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/試験日/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /プランを作成/ })).toBeInTheDocument();
    });
  });

  it('学習プランがある場合は進捗グラフを表示する', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(mockStudyPlan);
    vi.mocked(api.fetchStudyPlanSummary).mockResolvedValue(mockSummary);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByText(/残り/)).toBeInTheDocument();
      expect(screen.getByText(/40/)).toBeInTheDocument();
    });
  });

  it('新しい学習プランを作成できる', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(null);
    vi.mocked(api.createStudyPlan).mockResolvedValue(mockStudyPlan);
    vi.mocked(api.fetchStudyPlanSummary).mockResolvedValue(mockSummary);

    const user = userEvent.setup();
    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/試験日/)).toBeInTheDocument();
    });

    const examDateInput = screen.getByLabelText(/試験日/);
    const targetInput = screen.getByLabelText(/1日の目標問題数/);
    const submitButton = screen.getByRole('button', { name: /プランを作成/ });

    await user.clear(examDateInput);
    await user.type(examDateInput, '2026-03-15');
    await user.clear(targetInput);
    await user.type(targetInput, '20');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.createStudyPlan).toHaveBeenCalledWith({
        userId: 'test_user_123',
        examDate: '2026-03-15',
        targetQuestionsPerDay: 20,
      });
    });
  });

  it('学習プランを更新できる', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(mockStudyPlan);
    vi.mocked(api.fetchStudyPlanSummary).mockResolvedValue(mockSummary);
    vi.mocked(api.updateStudyPlan).mockResolvedValue({
      ...mockStudyPlan,
      examDate: '2026-04-01',
      targetQuestionsPerDay: 30,
    });

    const user = userEvent.setup();
    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /プランを更新/ })).toBeInTheDocument();
    });

    const examDateInput = screen.getByLabelText(/試験日/) as HTMLInputElement;
    const targetInput = screen.getByLabelText(/1日の目標問題数/) as HTMLInputElement;

    // fireEventを使ってdateを直接設定
    await user.clear(targetInput);
    await user.type(targetInput, '30');

    // date inputはfireEvent.changeで設定
    examDateInput.value = '2026-04-01';
    examDateInput.dispatchEvent(new Event('change', { bubbles: true }));

    await user.click(screen.getByRole('button', { name: /プランを更新/ }));

    await waitFor(() => {
      expect(api.updateStudyPlan).toHaveBeenCalled();
    });
  });

  it('学習プランを削除できる', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(mockStudyPlan);
    vi.mocked(api.fetchStudyPlanSummary).mockResolvedValue(mockSummary);
    vi.mocked(api.deleteStudyPlan).mockResolvedValue(undefined);
    // 削除後は再取得でnullを返す
    vi.mocked(api.fetchStudyPlan).mockResolvedValueOnce(mockStudyPlan).mockResolvedValueOnce(null);

    const user = userEvent.setup();
    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /削除/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /削除/ }));

    await waitFor(() => {
      expect(api.deleteStudyPlan).toHaveBeenCalledWith('test_user_123');
    });
  });

  it('ホームに戻るリンクを表示する', async () => {
    vi.mocked(api.fetchStudyPlan).mockResolvedValue(null);

    render(<StudyPlanPage />);

    await waitFor(() => {
      expect(screen.getByText(/ホームに戻る/)).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('接続エラー時に適切なメッセージを表示する', async () => {
      const fetchError = new TypeError('Failed to fetch');
      vi.mocked(api.fetchStudyPlan).mockRejectedValue(fetchError);

      render(<StudyPlanPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/サーバーに接続できません/)
        ).toBeInTheDocument();
      });
    });

    it('サーバーエラー時に一般的なエラーメッセージを表示する', async () => {
      vi.mocked(api.fetchStudyPlan).mockRejectedValue(new Error('API error: 500'));

      render(<StudyPlanPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/学習プランの読み込みに失敗しました/)
        ).toBeInTheDocument();
      });
    });

    it('エラー時にコンソールにログを出力する', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      vi.mocked(api.fetchStudyPlan).mockRejectedValue(error);

      render(<StudyPlanPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load study plan:', error);
      });

      consoleSpy.mockRestore();
    });
  });
});
