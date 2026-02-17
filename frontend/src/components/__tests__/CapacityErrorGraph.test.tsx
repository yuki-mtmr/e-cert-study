import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CapacityErrorGraph } from '../visual-explanations/CapacityErrorGraph';

describe('CapacityErrorGraph', () => {
  it('SVG を描画する', () => {
    const { container } = render(<CapacityErrorGraph />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('訓練誤差の polyline を描画する', () => {
    const { container } = render(<CapacityErrorGraph />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBeGreaterThanOrEqual(2);
  });

  it('3つの背景ゾーン（過少適合/最適/過剰適合）を描画する', () => {
    const { container } = render(<CapacityErrorGraph />);
    const zones = container.querySelectorAll('[data-testid^="zone-"]');
    expect(zones).toHaveLength(3);
  });

  it('軸ラベルを表示する', () => {
    render(<CapacityErrorGraph />);
    expect(screen.getByText('モデルの複雑さ →')).toBeInTheDocument();
    expect(screen.getByText('誤差 →')).toBeInTheDocument();
  });

  it('スライダーを描画する', () => {
    render(<CapacityErrorGraph />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('スライダー操作で状態表示が更新される', () => {
    render(<CapacityErrorGraph />);
    const slider = screen.getByRole('slider');

    // 初期値（0.5付近）→ optimal
    expect(screen.getByText(/最適/)).toBeInTheDocument();

    // 過少適合側へ
    fireEvent.change(slider, { target: { value: '0.1' } });
    expect(screen.getByText('過少適合')).toBeInTheDocument();

    // 過剰適合側へ
    fireEvent.change(slider, { target: { value: '0.9' } });
    expect(screen.getByText(/過剰適合/)).toBeInTheDocument();
  });

  it('凡例を表示する', () => {
    render(<CapacityErrorGraph />);
    expect(screen.getAllByText('訓練誤差').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('汎化誤差').length).toBeGreaterThanOrEqual(1);
  });
});
