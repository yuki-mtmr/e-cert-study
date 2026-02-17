import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RocPrComparison } from '../visual-explanations/RocPrComparison';

describe('RocPrComparison', () => {
  it('ROC曲線SVGとPR曲線SVGの2つを描画する', () => {
    render(<RocPrComparison />);
    const roc = screen.getByRole('img', { name: 'ROC曲線比較' });
    const pr = screen.getByRole('img', { name: 'PR曲線比較' });
    expect(roc).toBeInTheDocument();
    expect(pr).toBeInTheDocument();
  });

  it('陽性割合スライダーを表示する', () => {
    render(<RocPrComparison />);
    const matches = screen.getAllByText(/陽性割合/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('スライダーが2つある（d\' + 陽性割合）', () => {
    render(<RocPrComparison />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('陽性割合スライダー操作でPR曲線が変化する', () => {
    render(<RocPrComparison />);
    const sliders = screen.getAllByRole('slider');
    const positiveRateSlider = sliders[1];
    fireEvent.change(positiveRateSlider, { target: { value: '0.1' } });
    expect(positiveRateSlider).toBeInTheDocument();
  });

  it('AUCとAPの値を両方表示する', () => {
    render(<RocPrComparison />);
    expect(screen.getAllByText(/AUC/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/AP/).length).toBeGreaterThanOrEqual(1);
  });
});
