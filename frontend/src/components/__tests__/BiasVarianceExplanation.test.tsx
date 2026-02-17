import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex-mock">${formula}</span>`,
  },
}));

import { BiasVarianceExplanation } from '../visual-explanations/BiasVarianceExplanation';

describe('BiasVarianceExplanation', () => {
  it('3つのセクション見出しを描画する', () => {
    render(<BiasVarianceExplanation />);
    expect(screen.getByText(/射撃アナロジー/)).toBeInTheDocument();
    expect(screen.getByText(/数式で理解する/)).toBeInTheDocument();
    expect(screen.getByText(/クイックリファレンス/)).toBeInTheDocument();
  });

  it('正しい順序で描画される（射撃→数式→リファレンス）', () => {
    const { container } = render(<BiasVarianceExplanation />);
    const headings = container.querySelectorAll('h3');
    const texts = Array.from(headings).map((h) => h.textContent);
    const shootingIdx = texts.findIndex((t) => t?.includes('射撃'));
    const formulaIdx = texts.findIndex((t) => t?.includes('数式'));
    const refIdx = texts.findIndex((t) => t?.includes('リファレンス'));
    expect(shootingIdx).toBeLessThan(formulaIdx);
    expect(formulaIdx).toBeLessThan(refIdx);
  });
});
