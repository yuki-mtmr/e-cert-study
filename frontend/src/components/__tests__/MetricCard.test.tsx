import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from '@/components/visual-explanations/MetricCard';
import type { MetricFormulaV2 } from '@/lib/visual-explanations/confusion-matrix';

const mockMetric: MetricFormulaV2 = {
  id: 'precision',
  name: '適合率',
  enName: 'Precision',
  fraction: {
    numerator: [{ cellId: 'tp', label: 'TP' }],
    denominator: [
      { cellId: 'tp', label: 'TP' },
      { cellId: 'fp', label: 'FP' },
    ],
  },
  tip: '予測で陽性と言った中で本当に陽性（予測陽性の列）',
  highlight: {
    numeratorCells: ['tp'],
    denominatorOnlyCells: ['fp'],
  },
  cells: ['tp', 'fp'],
};

describe('MetricCard', () => {
  it('指標名を表示する', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    expect(screen.getByText('適合率')).toBeInTheDocument();
  });

  it('英語名を表示する', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    expect(screen.getByText('Precision')).toBeInTheDocument();
  });

  it('分数を内包する', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    expect(screen.getByTestId('fraction-numerator')).toBeInTheDocument();
    expect(screen.getByTestId('fraction-denominator')).toBeInTheDocument();
  });

  it('覚え方 tip を表示する', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    expect(screen.getByText(/予測で陽性と言った中で本当に陽性/)).toBeInTheDocument();
  });

  it('クリック時に onClick コールバックを呼ぶ', () => {
    const onClick = vi.fn();
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('metric-card-precision'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('選択状態でリングスタイルが適用される', () => {
    render(<MetricCard metric={mockMetric} isSelected={true} onClick={() => {}} />);
    const card = screen.getByTestId('metric-card-precision');
    expect(card.className).toContain('ring-2');
  });

  it('非選択状態でリングスタイルが適用されない', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    const card = screen.getByTestId('metric-card-precision');
    expect(card.className).not.toContain('ring-2');
  });

  it('data-testid が metric-card-{id} 形式である', () => {
    render(<MetricCard metric={mockMetric} isSelected={false} onClick={() => {}} />);
    expect(screen.getByTestId('metric-card-precision')).toBeInTheDocument();
  });
});
