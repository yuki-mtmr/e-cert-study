import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModelComparison } from '../visual-explanations/ModelComparison';

describe('ModelComparison', () => {
  it('ROC曲線SVGを描画する', () => {
    render(<ModelComparison />);
    const svg = screen.getByRole('img', { name: /モデル比較/ });
    expect(svg).toBeInTheDocument();
  });

  it('複数モデルの凡例を表示する', () => {
    render(<ModelComparison />);
    expect(screen.getByText(/モデルA/)).toBeInTheDocument();
    expect(screen.getByText(/モデルB/)).toBeInTheDocument();
    expect(screen.getByText(/モデルC/)).toBeInTheDocument();
  });

  it('d\'スライダーを表示する', () => {
    render(<ModelComparison />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(1);
  });

  it('複数のpolylineを描画する（モデル曲線 + 対角線）', () => {
    const { container } = render(<ModelComparison />);
    const polylines = container.querySelectorAll('polyline');
    // 3モデル + 1対角線 = 4
    expect(polylines.length).toBe(4);
  });

  it('AUC値を表示する', () => {
    render(<ModelComparison />);
    const aucElements = screen.getAllByText(/AUC/);
    expect(aucElements.length).toBeGreaterThanOrEqual(1);
  });
});
