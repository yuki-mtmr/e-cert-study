import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataSizeErrorGraph } from '../visual-explanations/DataSizeErrorGraph';

describe('DataSizeErrorGraph', () => {
  it('SVG を描画する', () => {
    const { container } = render(<DataSizeErrorGraph />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('polyline を2本描画する', () => {
    const { container } = render(<DataSizeErrorGraph />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines).toHaveLength(2);
  });

  it('背景ゾーンがない（CapacityErrorGraphとは異なる）', () => {
    const { container } = render(<DataSizeErrorGraph />);
    const zones = container.querySelectorAll('[data-testid^="zone-"]');
    expect(zones).toHaveLength(0);
  });

  it('軸ラベルを表示する', () => {
    render(<DataSizeErrorGraph />);
    expect(screen.getByText('学習データ量 →')).toBeInTheDocument();
    expect(screen.getByText('誤差 →')).toBeInTheDocument();
  });

  it('スライダーを描画する', () => {
    render(<DataSizeErrorGraph />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('スライダー操作で誤差値が変化する', () => {
    const { container } = render(<DataSizeErrorGraph />);
    const slider = screen.getByRole('slider');

    // 初期値の訓練誤差バーを記録
    const getBarWidth = () => {
      const bar = container.querySelector('[data-testid="training-error-bar"]') as HTMLElement;
      return bar?.style.width;
    };

    const initialWidth = getBarWidth();

    // データ量を増やす
    fireEvent.change(slider, { target: { value: '0.9' } });
    const updatedWidth = getBarWidth();

    expect(updatedWidth).not.toBe(initialWidth);
  });

  it('凡例を表示する', () => {
    render(<DataSizeErrorGraph />);
    expect(screen.getAllByText('訓練誤差').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('汎化誤差').length).toBeGreaterThanOrEqual(1);
  });
});
