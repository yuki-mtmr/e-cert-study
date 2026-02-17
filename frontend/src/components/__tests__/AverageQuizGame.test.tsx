import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AverageQuizGame } from '../visual-explanations/AverageQuizGame';

describe('AverageQuizGame', () => {
  it('最初の問題を表示する', () => {
    render(<AverageQuizGame />);
    expect(screen.getByTestId('quiz-scenario')).toBeInTheDocument();
  });

  it('回答ボタンを表示する', () => {
    render(<AverageQuizGame />);
    expect(screen.getByText('マクロ平均')).toBeInTheDocument();
    expect(screen.getByText('マイクロ平均')).toBeInTheDocument();
  });

  it('回答すると解説が表示される', () => {
    render(<AverageQuizGame />);
    const macroBtn = screen.getByText('マクロ平均');
    fireEvent.click(macroBtn);
    expect(screen.getByTestId('quiz-explanation')).toBeInTheDocument();
  });

  it('「次へ」ボタンで次の問題に進む', () => {
    render(<AverageQuizGame />);
    // 1問目に回答
    fireEvent.click(screen.getByText('マクロ平均'));
    // 次へ
    fireEvent.click(screen.getByText('次へ'));
    // 2問目が表示される
    expect(screen.getByTestId('quiz-scenario')).toBeInTheDocument();
  });

  it('5問完走するとスコアが表示される', () => {
    render(<AverageQuizGame />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('マクロ平均'));
      // 最後の問題は「結果を見る」、それ以外は「次へ」
      if (i < 4) {
        fireEvent.click(screen.getByText('次へ'));
      } else {
        fireEvent.click(screen.getByText('結果を見る'));
      }
    }
    expect(screen.getByTestId('quiz-score')).toBeInTheDocument();
  });
});
