import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MacroMicroCalculation } from '../visual-explanations/MacroMicroCalculation';
import { deriveClassMetrics } from '@/lib/visual-explanations/micro-macro-average';

describe('MacroMicroCalculation', () => {
  const matrix = [
    [50, 5, 5],
    [5, 50, 5],
    [5, 5, 50],
  ];
  const metrics = deriveClassMetrics(matrix);

  it('マクロ平均のセクションを表示する', () => {
    render(<MacroMicroCalculation metrics={metrics} />);
    expect(screen.getByText(/マクロ平均/)).toBeInTheDocument();
  });

  it('マイクロ平均のセクションを表示する', () => {
    render(<MacroMicroCalculation metrics={metrics} />);
    expect(screen.getByText(/マイクロ平均/)).toBeInTheDocument();
  });

  it('各クラスのPrecisionを表示する', () => {
    render(<MacroMicroCalculation metrics={metrics} />);
    const precisionElements = screen.getAllByText(/Precision/i);
    expect(precisionElements.length).toBeGreaterThanOrEqual(1);
  });
});
