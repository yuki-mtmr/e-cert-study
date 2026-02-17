import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
