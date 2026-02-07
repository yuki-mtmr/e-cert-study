import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MockExamResult } from '../MockExamResult';
import type { MockExamResult as MockExamResultType } from '@/types';

const makeResult = (overrides?: Partial<MockExamResultType>): MockExamResultType => ({
  examId: 'test-id',
  userId: 'test-user',
  startedAt: '2025-01-01T00:00:00Z',
  finishedAt: '2025-01-01T02:00:00Z',
  totalQuestions: 100,
  correctCount: 72,
  score: 72.0,
  passed: true,
  passingThreshold: 65.0,
  categoryScores: [
    { areaName: '応用数学', total: 10, correct: 7, accuracy: 70.0, grade: 'B' },
    { areaName: '機械学習', total: 25, correct: 20, accuracy: 80.0, grade: 'A' },
    { areaName: '深層学習の基礎', total: 30, correct: 22, accuracy: 73.3, grade: 'B' },
    { areaName: '深層学習の応用', total: 25, correct: 18, accuracy: 72.0, grade: 'B' },
    { areaName: '開発・運用環境', total: 10, correct: 5, accuracy: 50.0, grade: 'C' },
  ],
  analysis: '## 合格 - 安全圏\nスコア 72%',
  aiAnalysis: null,
  status: 'finished',
  ...overrides,
});

describe('MockExamResult', () => {
  it('合格時に合格バナーが表示されること', () => {
    const result = makeResult({ passed: true });
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText('合格')).toBeInTheDocument();
  });

  it('不合格時に不合格バナーが表示されること', () => {
    const result = makeResult({ passed: false, score: 50.0, correctCount: 50 });
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText('不合格')).toBeInTheDocument();
  });

  it('スコアが表示されること', () => {
    const result = makeResult();
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText(/72% \(72\/100\)/)).toBeInTheDocument();
  });

  it('カテゴリ別グレードが表示されること', () => {
    const result = makeResult();
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText('応用数学')).toBeInTheDocument();
    expect(screen.getByText('機械学習')).toBeInTheDocument();
  });

  it('AI分析ボタンが表示されること', () => {
    const result = makeResult();
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText(/AI.*分析/)).toBeInTheDocument();
  });

  it('AI分析ボタンをクリックするとコールバックが呼ばれること', () => {
    const onRequestAIAnalysis = vi.fn();
    const result = makeResult();
    render(
      <MockExamResult result={result} onRequestAIAnalysis={onRequestAIAnalysis} />
    );
    const button = screen.getByText(/AI.*分析/);
    fireEvent.click(button);
    expect(onRequestAIAnalysis).toHaveBeenCalledTimes(1);
  });

  it('AI分析が既にある場合は分析内容が表示されること', () => {
    const result = makeResult({ aiAnalysis: 'AI分析結果テスト' });
    render(
      <MockExamResult result={result} onRequestAIAnalysis={vi.fn()} />
    );
    expect(screen.getByText('AI分析結果テスト')).toBeInTheDocument();
  });
});
