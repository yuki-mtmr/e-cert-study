import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResidualPlot } from '../visual-explanations/ResidualPlot';

describe('ResidualPlot', () => {
  it('散布図のSVGを描画する', () => {
    render(<ResidualPlot />);
    const svg = screen.getByRole('img', { name: '残差ビジュアライゼーション' });
    expect(svg).toBeInTheDocument();
  });

  it('外れ値スライダーを表示する', () => {
    render(<ResidualPlot />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it('MAE/MSE表示切替ボタンを表示する', () => {
    render(<ResidualPlot />);
    expect(screen.getByRole('button', { name: 'MAE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MSE' })).toBeInTheDocument();
  });

  it('4つの指標値を表示する', () => {
    render(<ResidualPlot />);
    expect(screen.getByTestId('metric-mae')).toBeInTheDocument();
    expect(screen.getByTestId('metric-mse')).toBeInTheDocument();
    expect(screen.getByTestId('metric-rmse')).toBeInTheDocument();
    expect(screen.getByTestId('metric-r-squared')).toBeInTheDocument();
  });

  it('外れ値スライダー操作で指標値が変化する', () => {
    render(<ResidualPlot />);
    const maeEl = screen.getByTestId('metric-mae');
    const initialMAE = maeEl.textContent;

    const sliders = screen.getAllByRole('slider');
    // 外れ値スライダー（最初のスライダー）
    fireEvent.change(sliders[0], { target: { value: '1' } });

    const updatedMAE = screen.getByTestId('metric-mae').textContent;
    expect(updatedMAE).not.toBe(initialMAE);
  });

  it('MSEモードに切り替えできる', () => {
    render(<ResidualPlot />);
    const mseButton = screen.getByRole('button', { name: 'MSE' });
    fireEvent.click(mseButton);
    // MSEボタンがアクティブ状態になる（aria-pressedで確認）
    expect(mseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('データ点のcircle要素を描画する', () => {
    const { container } = render(<ResidualPlot />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(10);
  });

  it('残差線のline要素を描画する', () => {
    const { container } = render(<ResidualPlot />);
    const lines = container.querySelectorAll('line.residual-line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it('MSEモードで正方形（rect）要素を描画する', () => {
    const { container } = render(<ResidualPlot />);
    // MSEモードに切替
    fireEvent.click(screen.getByRole('button', { name: 'MSE' }));

    const rects = container.querySelectorAll('rect.residual-square');
    expect(rects.length).toBeGreaterThanOrEqual(1);
    // 正方形なので width === height
    const firstRect = rects[0];
    expect(firstRect.getAttribute('width')).toBe(firstRect.getAttribute('height'));
  });

  it('MAEモードではrect要素を描画しない', () => {
    const { container } = render(<ResidualPlot />);
    // デフォルトはMAEモード
    const rects = container.querySelectorAll('rect.residual-square');
    expect(rects.length).toBe(0);
  });
});
