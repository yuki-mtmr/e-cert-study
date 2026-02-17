import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaticTarget } from '../visual-explanations/StaticTarget';
import type { TargetScenario } from '@/lib/visual-explanations/bias-variance';

const scenario: TargetScenario = {
  id: 'low-bias-low-var',
  label: '低Bias・低Variance',
  caption: '理想的：的の中心付近に密集',
  biasLevel: 'low',
  varianceLevel: 'low',
  bias: 0.05,
  variance: 0.05,
};

describe('StaticTarget', () => {
  it('SVG要素を描画する', () => {
    const { container } = render(<StaticTarget scenario={scenario} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('ラベルテキストを表示する', () => {
    render(<StaticTarget scenario={scenario} />);
    expect(screen.getByText('低Bias・低Variance')).toBeInTheDocument();
  });

  it('キャプションテキストを表示する', () => {
    render(<StaticTarget scenario={scenario} />);
    expect(screen.getByText('理想的：的の中心付近に密集')).toBeInTheDocument();
  });

  it('同心円（的の環）を描画する', () => {
    const { container } = render(<StaticTarget scenario={scenario} />);
    const circles = container.querySelectorAll('circle');
    // 同心円3本 + bullseye中心1 + ドット群
    expect(circles.length).toBeGreaterThanOrEqual(4);
  });

  it('ドット群（赤丸）を描画する', () => {
    const { container } = render(<StaticTarget scenario={scenario} />);
    const redDots = container.querySelectorAll('[data-testid="target-dot"]');
    expect(redDots.length).toBeGreaterThan(0);
  });

  it('アクセシビリティ: SVGにrole=imgとaria-labelがある', () => {
    const { container } = render(<StaticTarget scenario={scenario} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label');
  });
});
