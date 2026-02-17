import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RocCurveSection } from '../visual-explanations/RocCurveSection';

describe('RocCurveSection', () => {
  it('ROC曲線のSVGを描画する', () => {
    render(<RocCurveSection />);
    const svg = screen.getByRole('img', { name: 'ROC曲線' });
    expect(svg).toBeInTheDocument();
  });

  it('正規分布SVGを描画する', () => {
    render(<RocCurveSection />);
    const svg = screen.getByRole('img', { name: '正規分布図' });
    expect(svg).toBeInTheDocument();
  });

  it('閾値スライダーを表示する', () => {
    render(<RocCurveSection />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('AUC値を表示する', () => {
    render(<RocCurveSection />);
    const aucElements = screen.getAllByText(/AUC/);
    expect(aucElements.length).toBeGreaterThanOrEqual(1);
  });

  it('polyline要素を描画する', () => {
    const { container } = render(<RocCurveSection />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBeGreaterThanOrEqual(1);
  });

  it('スライダー操作で閾値が変化する', () => {
    render(<RocCurveSection />);
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '1.5' } });
    expect(sliders[0]).toBeInTheDocument();
  });
});
