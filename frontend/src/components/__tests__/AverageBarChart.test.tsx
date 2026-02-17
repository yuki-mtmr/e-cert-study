import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AverageBarChart } from '../visual-explanations/AverageBarChart';

describe('AverageBarChart', () => {
  const macro = { precision: 0.8, recall: 0.75, f1: 0.77 };
  const micro = { precision: 0.82, recall: 0.78, f1: 0.80 };

  it('SVGバーチャートを描画する', () => {
    render(<AverageBarChart macro={macro} micro={micro} />);
    const svg = screen.getByRole('img', { name: /マクロ.*マイクロ/ });
    expect(svg).toBeInTheDocument();
  });

  it('rect要素を6つ描画する（3指標×2平均）', () => {
    const { container } = render(<AverageBarChart macro={macro} micro={micro} />);
    const rects = container.querySelectorAll('rect[data-testid]');
    expect(rects).toHaveLength(6);
  });

  it('凡例を表示する', () => {
    render(<AverageBarChart macro={macro} micro={micro} />);
    expect(screen.getByText('マクロ')).toBeInTheDocument();
    expect(screen.getByText('マイクロ')).toBeInTheDocument();
  });

  it('各バーの右端に数値ラベルを表示する', () => {
    const { container } = render(<AverageBarChart macro={macro} micro={micro} />);
    const valueLabels = container.querySelectorAll('[data-testid^="value-"]');
    // 3指標 × 2平均 = 6つの数値ラベル
    expect(valueLabels).toHaveLength(6);
  });
});
