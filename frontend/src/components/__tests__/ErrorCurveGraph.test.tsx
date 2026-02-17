import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorCurveGraph } from '../visual-explanations/ErrorCurveGraph';

describe('ErrorCurveGraph', () => {
  it('2つの子グラフを描画する（SVG が2つ）', () => {
    const { container } = render(<ErrorCurveGraph />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
  });

  it('図1の見出しテキストを表示する', () => {
    render(<ErrorCurveGraph />);
    expect(screen.getByText('図1: モデル容量と誤差')).toBeInTheDocument();
  });

  it('図2の見出しテキストを表示する', () => {
    render(<ErrorCurveGraph />);
    expect(screen.getByText('図2: 学習データ量と誤差')).toBeInTheDocument();
  });

  it('全体のpolylineが4本（各グラフ2本ずつ）', () => {
    const { container } = render(<ErrorCurveGraph />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines).toHaveLength(4);
  });
});
