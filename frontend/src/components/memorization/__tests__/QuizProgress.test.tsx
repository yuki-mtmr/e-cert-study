import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizProgress } from '../QuizProgress';

describe('QuizProgress', () => {
  it('現在の問題番号と合計を表示', () => {
    render(<QuizProgress currentIndex={2} total={10} correctCount={1} />);
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('正答数を表示', () => {
    render(<QuizProgress currentIndex={4} total={10} correctCount={3} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('プログレスバーが存在する', () => {
    render(<QuizProgress currentIndex={2} total={10} correctCount={1} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
  });
});
