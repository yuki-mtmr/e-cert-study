import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex">${formula}</span>`,
  },
}));

import { LossActivationGuide } from '../visual-explanations/LossActivationGuide';

describe('LossActivationGuide', () => {
  it('4つのタスク行を持つ比較表を描画する', () => {
    const { container } = render(<LossActivationGuide />);
    const rows = container.querySelectorAll('[data-testid="task-row"]');
    expect(rows).toHaveLength(4);
  });

  it('タスク名が表示される', () => {
    render(<LossActivationGuide />);
    expect(screen.getByText('2値分類')).toBeInTheDocument();
    // 多クラス・マルチラベルは比較セクションにも出るため複数ヒット
    expect(screen.getAllByText('多クラス分類').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('マルチラベル分類').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('順序回帰')).toBeInTheDocument();
  });

  it('活性化関数名が表示される', () => {
    render(<LossActivationGuide />);
    expect(screen.getAllByText(/シグモイド/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ソフトマックス/).length).toBeGreaterThanOrEqual(1);
  });

  it('比較表にKaTeX数式が含まれる', () => {
    const { container } = render(<LossActivationGuide />);
    const katexEls = container.querySelectorAll('.katex');
    expect(katexEls.length).toBeGreaterThanOrEqual(4);
  });

  it('順序回帰セクションに閾値の説明が含まれる', () => {
    render(<LossActivationGuide />);
    expect(screen.getByText(/≥ 2/)).toBeInTheDocument();
    expect(screen.getByText(/≥ 3/)).toBeInTheDocument();
  });

  it('「よくある誤解」セクションが存在する', () => {
    render(<LossActivationGuide />);
    expect(screen.getByText(/よくある誤解/)).toBeInTheDocument();
  });

  it('順序回帰のビジュアル説明が存在する', () => {
    const { container } = render(<LossActivationGuide />);
    const ordinalSection = container.querySelector(
      '[data-testid="ordinal-explanation"]',
    );
    expect(ordinalSection).toBeInTheDocument();
  });

  it('多クラス vs マルチラベルの違い説明が存在する', () => {
    const { container } = render(<LossActivationGuide />);
    const diffSection = container.querySelector(
      '[data-testid="multiclass-vs-multilabel"]',
    );
    expect(diffSection).toBeInTheDocument();
  });
});
