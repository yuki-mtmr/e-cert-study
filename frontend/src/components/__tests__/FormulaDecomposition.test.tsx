import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex-mock">${formula}</span>`,
  },
}));

import { FormulaDecomposition } from '../visual-explanations/FormulaDecomposition';

describe('FormulaDecomposition', () => {
  it('3つのタブボタンを描画する', () => {
    render(<FormulaDecomposition />);
    expect(screen.getByRole('tab', { name: /Bias/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Variance/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Noise/ })).toBeInTheDocument();
  });

  it('デフォルトでBias²タブがアクティブ', () => {
    render(<FormulaDecomposition />);
    const biasTab = screen.getByRole('tab', { name: /Bias/ });
    expect(biasTab).toHaveAttribute('aria-selected', 'true');
  });

  it('Varianceタブクリックでコンテンツが切り替わる', () => {
    render(<FormulaDecomposition />);
    fireEvent.click(screen.getByRole('tab', { name: /Variance/ }));
    expect(
      screen.getByText(/訓練データが変わるたびに/),
    ).toBeInTheDocument();
  });

  it('Noiseタブクリックでコンテンツが切り替わる', () => {
    render(<FormulaDecomposition />);
    fireEvent.click(screen.getByRole('tab', { name: /Noise/ }));
    expect(
      screen.getByText(/データ自体が持つ/),
    ).toBeInTheDocument();
  });

  it('セクション見出しを表示する', () => {
    render(<FormulaDecomposition />);
    expect(screen.getByText(/数式で理解する/)).toBeInTheDocument();
  });
});
