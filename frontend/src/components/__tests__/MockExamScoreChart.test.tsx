/**
 * 模試成長推移グラフのテスト
 *
 * transformExamsToChartData関数のユニットテスト + コンポーネント表示テスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MockExamHistoryItem } from '@/types';

// rechartsのモック
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

import { MockExamScoreChart, transformExamsToChartData } from '../MockExamScoreChart';

const PASSING_THRESHOLD = 65;

const createExam = (
  overrides: Partial<MockExamHistoryItem> = {},
): MockExamHistoryItem => ({
  examId: 'exam-1',
  startedAt: '2026-01-15T10:00:00',
  finishedAt: '2026-01-15T12:00:00',
  score: 70,
  passed: true,
  status: 'finished',
  ...overrides,
});

describe('transformExamsToChartData', () => {
  it('finishedのみをフィルタする', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ examId: 'e1', status: 'finished', score: 70 }),
      createExam({ examId: 'e2', status: 'in_progress', score: 0 }),
      createExam({ examId: 'e3', status: 'finished', score: 80 }),
    ];
    const result = transformExamsToChartData(exams, PASSING_THRESHOLD);
    expect(result).toHaveLength(2);
  });

  it('startedAt昇順でソートする', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ examId: 'e1', startedAt: '2026-02-10T10:00:00', score: 60 }),
      createExam({ examId: 'e2', startedAt: '2026-01-15T10:00:00', score: 50 }),
      createExam({ examId: 'e3', startedAt: '2026-01-20T10:00:00', score: 70 }),
    ];
    const result = transformExamsToChartData(exams, PASSING_THRESHOLD);
    expect(result[0].score).toBe(50);
    expect(result[1].score).toBe(70);
    expect(result[2].score).toBe(60);
  });

  it('labelをM/D形式に変換する', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ startedAt: '2026-01-15T10:00:00' }),
    ];
    const result = transformExamsToChartData(exams, PASSING_THRESHOLD);
    expect(result[0].label).toBe('1/15');
  });

  it('合格ラインをデータに含める', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ score: 70 }),
    ];
    const result = transformExamsToChartData(exams, PASSING_THRESHOLD);
    expect(result[0].passingLine).toBe(65);
  });

  it('examNumberを振る', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ examId: 'e1', startedAt: '2026-01-10T10:00:00' }),
      createExam({ examId: 'e2', startedAt: '2026-01-20T10:00:00' }),
    ];
    const result = transformExamsToChartData(exams, PASSING_THRESHOLD);
    expect(result[0].examNumber).toBe(1);
    expect(result[1].examNumber).toBe(2);
  });

  it('空配列で空配列を返す', () => {
    const result = transformExamsToChartData([], PASSING_THRESHOLD);
    expect(result).toEqual([]);
  });
});

describe('MockExamScoreChart', () => {
  it('グラフコンポーネントを表示する', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ examId: 'e1', startedAt: '2026-01-10T10:00:00', score: 60 }),
      createExam({ examId: 'e2', startedAt: '2026-01-20T10:00:00', score: 75 }),
    ];
    render(<MockExamScoreChart exams={exams} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('タイトルを表示する', () => {
    const exams: MockExamHistoryItem[] = [
      createExam({ examId: 'e1' }),
      createExam({ examId: 'e2' }),
    ];
    render(<MockExamScoreChart exams={exams} />);

    expect(screen.getByText('スコア推移')).toBeInTheDocument();
  });

  it('データがない場合はメッセージを表示する', () => {
    render(<MockExamScoreChart exams={[]} />);

    expect(screen.getByText(/完了した模試が/)).toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });
});
