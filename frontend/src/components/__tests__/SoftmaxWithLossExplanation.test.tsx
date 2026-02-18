import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoftmaxWithLossExplanation } from '../visual-explanations/SoftmaxWithLossExplanation';

describe('SoftmaxWithLossExplanation', () => {
  it('4つのセクション見出しを描画する', () => {
    render(<SoftmaxWithLossExplanation />);
    expect(screen.getByText(/axis\/keepdimsの行列操作/)).toBeInTheDocument();
    expect(screen.getByText(/クロスエントロピー計算/)).toBeInTheDocument();
    expect(screen.getByText(/Forward\/Backward/)).toBeInTheDocument();
    expect(screen.getByText(/勾配バーチャート/)).toBeInTheDocument();
  });

  it('axis切替トグルボタンが描画される', () => {
    render(<SoftmaxWithLossExplanation />);
    expect(screen.getByRole('button', { name: /axis=0/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /axis=1/ })).toBeInTheDocument();
  });

  it('axis=1ボタンが初期状態でアクティブ', () => {
    render(<SoftmaxWithLossExplanation />);
    const btn1 = screen.getByRole('button', { name: /axis=1/ });
    expect(btn1).toHaveAttribute('aria-pressed', 'true');
  });

  it('axis=0ボタンクリックでトグルが切り替わる', () => {
    render(<SoftmaxWithLossExplanation />);
    const btn0 = screen.getByRole('button', { name: /axis=0/ });
    fireEvent.click(btn0);
    expect(btn0).toHaveAttribute('aria-pressed', 'true');
  });

  it('要点ボックスが表示される', () => {
    render(<SoftmaxWithLossExplanation />);
    expect(
      screen.getByText(/axis=1, keepdims=True.*ブロードキャスト/),
    ).toBeInTheDocument();
  });

  it('フロー図にforward/backwardのステップが含まれる', () => {
    render(<SoftmaxWithLossExplanation />);
    expect(screen.getByText('softmax')).toBeInTheDocument();
    expect(screen.getByText('self.y')).toBeInTheDocument();
  });

  it('勾配バーチャートSVGが描画される', () => {
    const { container } = render(<SoftmaxWithLossExplanation />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('末尾に4択問題のdetailsが含まれる', () => {
    render(<SoftmaxWithLossExplanation />);
    expect(screen.getByText('4択問題で確認する')).toBeInTheDocument();
  });
});
