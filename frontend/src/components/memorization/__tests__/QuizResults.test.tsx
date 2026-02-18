import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizResults } from '../QuizResults';
import type { QuizSessionResult, MemorizationQuestion } from '@/types/memorization';

const QUESTIONS: MemorizationQuestion[] = [
  { id: 1, category: '最適化', question: 'Q1', choices: ['A', 'B', 'C', 'D'], answer: 'A', hint: 'H1' },
  { id: 2, category: 'CNN', question: 'Q2', choices: ['A', 'B', 'C', 'D'], answer: 'B', hint: 'H2' },
  { id: 3, category: 'CNN', question: 'Q3', choices: ['A', 'B', 'C', 'D'], answer: 'C', hint: 'H3' },
];

const SESSION_RESULT: QuizSessionResult = {
  totalQuestions: 3,
  correctCount: 1,
  accuracy: 33,
  answers: [
    { questionId: 1, selected: 'A', isCorrect: true },
    { questionId: 2, selected: 'A', isCorrect: false },
    { questionId: 3, selected: 'A', isCorrect: false },
  ],
};

describe('QuizResults', () => {
  it('正答率を表示', () => {
    render(
      <QuizResults
        result={SESSION_RESULT}
        questions={QUESTIONS}
        onRetry={vi.fn()}
        onReset={vi.fn()}
        hasIncorrect={true}
      />,
    );
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('カテゴリ別正答率を表示', () => {
    render(
      <QuizResults
        result={SESSION_RESULT}
        questions={QUESTIONS}
        onRetry={vi.fn()}
        onReset={vi.fn()}
        hasIncorrect={true}
      />,
    );
    expect(screen.getByText('最適化')).toBeInTheDocument();
    expect(screen.getByText('CNN')).toBeInTheDocument();
  });

  it('間違い一覧を表示', () => {
    render(
      <QuizResults
        result={SESSION_RESULT}
        questions={QUESTIONS}
        onRetry={vi.fn()}
        onReset={vi.fn()}
        hasIncorrect={true}
      />,
    );
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('Q3')).toBeInTheDocument();
  });

  it('間違いだけ再挑戦ボタンが動作する', () => {
    const onRetry = vi.fn();
    render(
      <QuizResults
        result={SESSION_RESULT}
        questions={QUESTIONS}
        onRetry={onRetry}
        onReset={vi.fn()}
        hasIncorrect={true}
      />,
    );
    fireEvent.click(screen.getByText('間違いだけ再挑戦'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('最初からやり直すボタンが動作する', () => {
    const onReset = vi.fn();
    render(
      <QuizResults
        result={SESSION_RESULT}
        questions={QUESTIONS}
        onRetry={vi.fn()}
        onReset={onReset}
        hasIncorrect={true}
      />,
    );
    fireEvent.click(screen.getByText('最初からやり直す'));
    expect(onReset).toHaveBeenCalled();
  });

  it('全問正解時は再挑戦ボタンが非表示', () => {
    const perfectResult: QuizSessionResult = {
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      answers: [{ questionId: 1, selected: 'A', isCorrect: true }],
    };
    render(
      <QuizResults
        result={perfectResult}
        questions={QUESTIONS}
        onRetry={vi.fn()}
        onReset={vi.fn()}
        hasIncorrect={false}
      />,
    );
    expect(screen.queryByText('間違いだけ再挑戦')).not.toBeInTheDocument();
  });
});
