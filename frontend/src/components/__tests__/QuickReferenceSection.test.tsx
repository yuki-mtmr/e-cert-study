import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// KaTeXをモック
vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex">${formula}</span>`,
  },
}));

import { QuickReferenceSection } from '../visual-explanations/QuickReferenceSection';

describe('QuickReferenceSection', () => {
  it('セクション見出しを表示する', () => {
    render(<QuickReferenceSection />);
    expect(screen.getByText(/クイックリファレンス/)).toBeInTheDocument();
  });

  it('3枚のカードを描画する', () => {
    const { container } = render(<QuickReferenceSection />);
    const cards = container.querySelectorAll('[data-testid="reference-card"]');
    expect(cards).toHaveLength(3);
  });

  it('Bias², Variance, Noiseのカードタイトルがある', () => {
    render(<QuickReferenceSection />);
    expect(screen.getByText(/Bias²/)).toBeInTheDocument();
    expect(screen.getByText(/Variance/)).toBeInTheDocument();
    expect(screen.getByText(/Noise/)).toBeInTheDocument();
  });

  it('フローチャートを描画する', () => {
    const { container } = render(<QuickReferenceSection />);
    const flowchart = container.querySelector('[data-testid="identification-flowchart"]');
    expect(flowchart).toBeInTheDocument();
  });

  it('積分記号がKaTeX出力で描画される', () => {
    const { container } = render(<QuickReferenceSection />);
    const cards = container.querySelectorAll('[data-testid="reference-card"]');
    // 各カードにKaTeX出力が含まれる
    for (const card of cards) {
      const katexEl = card.querySelector('.katex');
      expect(katexEl).toBeInTheDocument();
    }
  });
});
