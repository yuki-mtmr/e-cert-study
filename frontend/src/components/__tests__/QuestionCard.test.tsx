/**
 * 問題カードコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import type { Question } from '@/types';

const mockQuestion: Question = {
  id: '1',
  categoryId: 'cat1',
  content: 'ニューラルネットワークにおいて、活性化関数の役割は何か？',
  choices: [
    '入力データの正規化',
    '非線形性の導入',
    '損失関数の計算',
    '勾配の計算',
  ],
  correctAnswer: 1,
  explanation: '活性化関数は、ニューラルネットワークに非線形性を導入することで、複雑なパターンを学習可能にします。',
  difficulty: 3,
  source: 'E資格対策問題集',
  contentType: 'plain',
  images: [],
};

describe('QuestionCard', () => {
  it('問題文を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText(/ニューラルネットワークにおいて/)).toBeInTheDocument();
  });

  it('選択肢を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText('入力データの正規化')).toBeInTheDocument();
    expect(screen.getByText('非線形性の導入')).toBeInTheDocument();
    expect(screen.getByText('損失関数の計算')).toBeInTheDocument();
    expect(screen.getByText('勾配の計算')).toBeInTheDocument();
  });

  it('選択肢をクリックすると選択状態になる', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);

    expect(choice.closest('button')).toHaveClass('selected');
  });

  it('回答ボタンをクリックするとonAnswerが呼ばれる', () => {
    const onAnswer = vi.fn();
    render(<QuestionCard question={mockQuestion} onAnswer={onAnswer} />);

    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);

    const submitButton = screen.getByRole('button', { name: /回答する/i });
    fireEvent.click(submitButton);

    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('選択していない場合は回答ボタンが無効', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /回答する/i });
    expect(submitButton).toBeDisabled();
  });

  it('回答後に正誤と解説を表示する', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswer={1}
        isCorrect={true}
      />
    );

    expect(screen.getByText(/正解/)).toBeInTheDocument();
    expect(screen.getByText(/活性化関数は、ニューラルネットワーク/)).toBeInTheDocument();
  });

  it('不正解の場合は正解を示す', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswer={0}
        isCorrect={false}
      />
    );

    expect(screen.getByText(/不正解/)).toBeInTheDocument();
    expect(screen.getByText(/正解は「非線形性の導入」/)).toBeInTheDocument();
  });

  it('難易度を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText(/難易度/)).toBeInTheDocument();
  });

  it('問題が変わると選択状態がリセットされる', () => {
    const newQuestion: Question = {
      ...mockQuestion,
      id: '2',
      content: '別の問題',
    };

    const { rerender } = render(
      <QuestionCard question={mockQuestion} onAnswer={vi.fn()} />
    );

    // 最初の問題で選択肢をクリック
    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);
    expect(choice.closest('button')).toHaveClass('selected');

    // 問題を切り替え
    rerender(<QuestionCard question={newQuestion} onAnswer={vi.fn()} />);

    // 選択状態がリセットされていることを確認
    const choiceAfterRerender = screen.getByText('非線形性の導入');
    expect(choiceAfterRerender.closest('button')).not.toHaveClass('selected');

    // 回答ボタンが無効になっていることを確認
    const submitButton = screen.getByRole('button', { name: /回答する/i });
    expect(submitButton).toBeDisabled();
  });
});
