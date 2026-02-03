/**
 * 進捗グラフコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressChart } from '../ProgressChart';
import type { DailyGoalProgress, StudyPlanSummary } from '@/types';

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

const mockDailyProgress: DailyGoalProgress[] = [
  {
    date: '2026-02-01',
    targetCount: 20,
    actualCount: 22,
    correctCount: 18,
  },
  {
    date: '2026-02-02',
    targetCount: 20,
    actualCount: 20,
    correctCount: 16,
  },
  {
    date: '2026-02-03',
    targetCount: 20,
    actualCount: 15,
    correctCount: 12,
  },
];

const mockSummary: StudyPlanSummary = {
  daysRemaining: 40,
  totalAnswered: 57,
  totalCorrect: 46,
  accuracy: 80.7,
  streak: 3,
  dailyProgress: mockDailyProgress,
};

describe('ProgressChart', () => {
  it('進捗グラフを表示する', () => {
    render(<ProgressChart summary={mockSummary} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('残り日数を表示する', () => {
    render(<ProgressChart summary={mockSummary} />);

    expect(screen.getByText(/残り/)).toBeInTheDocument();
    expect(screen.getByText(/40/)).toBeInTheDocument();
  });

  it('合計回答数を表示する', () => {
    render(<ProgressChart summary={mockSummary} />);

    expect(screen.getByText(/総回答数/)).toBeInTheDocument();
    expect(screen.getByText(/57/)).toBeInTheDocument();
  });

  it('正解率を表示する', () => {
    render(<ProgressChart summary={mockSummary} />);

    expect(screen.getByText(/正解率/)).toBeInTheDocument();
    expect(screen.getByText(/80.7%/)).toBeInTheDocument();
  });

  it('連続学習日数を表示する', () => {
    render(<ProgressChart summary={mockSummary} />);

    expect(screen.getByText(/連続/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('データがない場合はメッセージを表示する', () => {
    const emptySummary: StudyPlanSummary = {
      daysRemaining: 40,
      totalAnswered: 0,
      totalCorrect: 0,
      accuracy: 0,
      streak: 0,
      dailyProgress: [],
    };

    render(<ProgressChart summary={emptySummary} />);

    expect(screen.getByText(/まだ学習データがありません/)).toBeInTheDocument();
  });

  it('残り日数が0以下の場合は警告を表示する', () => {
    const expiredSummary: StudyPlanSummary = {
      ...mockSummary,
      daysRemaining: -1,
    };

    render(<ProgressChart summary={expiredSummary} />);

    expect(screen.getByText(/試験日を過ぎています/)).toBeInTheDocument();
  });
});
