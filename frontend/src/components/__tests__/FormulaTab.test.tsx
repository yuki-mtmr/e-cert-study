import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// KaTeXをモック
vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex-mock">${formula}</span>`,
  },
}));

import { FormulaTab } from '../visual-explanations/FormulaTab';
import type { FormulaTabData } from '@/lib/visual-explanations/formula-data';

const mockTab: FormulaTabData = {
  id: 'bias',
  title: 'Bias²（バイアスの二乗）',
  fullFormula: '\\int E_D[y] dx',
  parts: [
    {
      id: 'model-mean',
      latex: 'E_D[y]',
      color: '#3B82F6',
      label: 'モデル平均',
      tooltip: '説明テキスト',
    },
  ],
  summary: 'モデルの平均的な予測が、真の答えからどれだけズレているか',
  analogyText: '狙いの中心が的の中心からどれだけ外れているか',
};

describe('FormulaTab', () => {
  it('KaTeX出力（モック）を描画する', () => {
    const { container } = render(<FormulaTab tab={mockTab} />);
    const katexEl = container.querySelector('.katex-mock');
    expect(katexEl).toBeInTheDocument();
  });

  it('要約テキストを表示する', () => {
    render(<FormulaTab tab={mockTab} />);
    expect(
      screen.getByText('モデルの平均的な予測が、真の答えからどれだけズレているか'),
    ).toBeInTheDocument();
  });

  it('射撃対応テキストを表示する', () => {
    render(<FormulaTab tab={mockTab} />);
    expect(
      screen.getByText(/狙いの中心が的の中心からどれだけ外れているか/),
    ).toBeInTheDocument();
  });

  it('色分けパーツを表示する', () => {
    render(<FormulaTab tab={mockTab} />);
    expect(screen.getByText('モデル平均')).toBeInTheDocument();
  });

  it('パーツにツールチップ（title属性）がある', () => {
    render(<FormulaTab tab={mockTab} />);
    const part = screen.getByText('モデル平均');
    expect(part.closest('[title]')).toHaveAttribute('title', '説明テキスト');
  });
});
