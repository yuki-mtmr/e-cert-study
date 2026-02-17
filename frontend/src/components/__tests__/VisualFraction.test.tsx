import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualFraction } from '@/components/visual-explanations/VisualFraction';
import type { VisualFraction as VisualFractionType } from '@/lib/visual-explanations/confusion-matrix';

const precisionFraction: VisualFractionType = {
  numerator: [{ cellId: 'tp', label: 'TP' }],
  denominator: [
    { cellId: 'tp', label: 'TP' },
    { cellId: 'fp', label: 'FP' },
  ],
};

const f1Fraction: VisualFractionType = {
  numerator: [{ cellId: 'tp', label: 'TP', coefficient: 2 }],
  denominator: [
    { cellId: 'tp', label: 'TP', coefficient: 2 },
    { cellId: 'fp', label: 'FP' },
    { cellId: 'fn', label: 'FN' },
  ],
};

describe('VisualFraction', () => {
  it('分子のラベルを表示する', () => {
    render(<VisualFraction fraction={precisionFraction} />);
    const numerator = screen.getByTestId('fraction-numerator');
    expect(numerator).toHaveTextContent('TP');
  });

  it('分母のラベルを表示する', () => {
    render(<VisualFraction fraction={precisionFraction} />);
    const denominator = screen.getByTestId('fraction-denominator');
    expect(denominator).toHaveTextContent('TP');
    expect(denominator).toHaveTextContent('FP');
  });

  it('分数線が存在する', () => {
    render(<VisualFraction fraction={precisionFraction} />);
    expect(screen.getByTestId('fraction-line')).toBeInTheDocument();
  });

  it('分母に複数項がある場合プラス記号を表示する', () => {
    render(<VisualFraction fraction={precisionFraction} />);
    const denominator = screen.getByTestId('fraction-denominator');
    expect(denominator).toHaveTextContent('+');
  });

  it('係数がある場合に表示する', () => {
    render(<VisualFraction fraction={f1Fraction} />);
    const numerator = screen.getByTestId('fraction-numerator');
    expect(numerator).toHaveTextContent('2');
    expect(numerator).toHaveTextContent('TP');
  });

  it('各項にセルIDに対応した色クラスを適用する', () => {
    const { container } = render(<VisualFraction fraction={precisionFraction} />);
    const greenSpans = container.querySelectorAll('.text-green-600');
    expect(greenSpans.length).toBeGreaterThanOrEqual(1);
    const orangeSpans = container.querySelectorAll('.text-orange-600');
    expect(orangeSpans.length).toBeGreaterThanOrEqual(1);
  });

  it('分子が1項のみの場合プラス記号を表示しない', () => {
    render(<VisualFraction fraction={precisionFraction} />);
    const numerator = screen.getByTestId('fraction-numerator');
    expect(numerator).not.toHaveTextContent('+');
  });
});
