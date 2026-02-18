import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizQuestion } from '../QuizQuestion';
import type { MemorizationQuestion, UserAnswer } from '@/types/memorization';

const QUESTION: MemorizationQuestion = {
  id: 1,
  category: '最適化',
  question: 'テスト問題',
  choices: ['選択肢A', '選択肢B', '選択肢C', '選択肢D'],
  answer: 'B',
  hint: 'ヒントテキスト',
};

describe('QuizQuestion', () => {
  it('問題文とカテゴリを表示', () => {
    render(<QuizQuestion question={QUESTION} lastAnswer={null} onAnswer={vi.fn()} />);
    expect(screen.getByText('テスト問題')).toBeInTheDocument();
    expect(screen.getByText('最適化')).toBeInTheDocument();
  });

  it('4つの選択肢を表示', () => {
    render(<QuizQuestion question={QUESTION} lastAnswer={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/選択肢A/)).toBeInTheDocument();
    expect(screen.getByText(/選択肢B/)).toBeInTheDocument();
    expect(screen.getByText(/選択肢C/)).toBeInTheDocument();
    expect(screen.getByText(/選択肢D/)).toBeInTheDocument();
  });

  it('選択肢クリックでonAnswerが呼ばれる', () => {
    const onAnswer = vi.fn();
    render(<QuizQuestion question={QUESTION} lastAnswer={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText(/選択肢A/));
    expect(onAnswer).toHaveBeenCalledWith('A');
  });

  it('回答後は選択肢がクリックできない', () => {
    const onAnswer = vi.fn();
    const answer: UserAnswer = { questionId: 1, selected: 'A', isCorrect: false };
    render(<QuizQuestion question={QUESTION} lastAnswer={answer} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText(/選択肢C/));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('正解時に正解マーク表示', () => {
    const answer: UserAnswer = { questionId: 1, selected: 'B', isCorrect: true };
    render(<QuizQuestion question={QUESTION} lastAnswer={answer} onAnswer={vi.fn()} />);
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('不正解時に不正解マークと正解ハイライト表示', () => {
    const answer: UserAnswer = { questionId: 1, selected: 'A', isCorrect: false };
    render(<QuizQuestion question={QUESTION} lastAnswer={answer} onAnswer={vi.fn()} />);
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('ヒントボタンでヒント表示をトグル', () => {
    render(<QuizQuestion question={QUESTION} lastAnswer={null} onAnswer={vi.fn()} />);
    expect(screen.queryByText('ヒントテキスト')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('ヒント'));
    expect(screen.getByText('ヒントテキスト')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ヒント'));
    expect(screen.queryByText('ヒントテキスト')).not.toBeInTheDocument();
  });
});
