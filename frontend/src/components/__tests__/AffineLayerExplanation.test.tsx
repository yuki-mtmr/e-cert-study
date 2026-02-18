import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AffineLayerExplanation } from '../visual-explanations/AffineLayerExplanation';

describe('AffineLayerExplanation', () => {
  it('3つのセクション見出しを描画する', () => {
    const { container } = render(<AffineLayerExplanation />);
    const headings = container.querySelectorAll('h3');
    const texts = Array.from(headings).map((h) => h.textContent);
    expect(texts).toContainEqual(expect.stringContaining('Forward'));
    expect(texts).toContainEqual(expect.stringContaining('Backward'));
    expect(texts).toContainEqual(expect.stringContaining('まとめ'));
  });

  it('Forward図にMatrixShapeBlockが含まれる（X, W, Outのラベル）', () => {
    render(<AffineLayerExplanation />);
    expect(screen.getByLabelText('行列 X (N×D)')).toBeInTheDocument();
    expect(screen.getByLabelText('行列 W (D×M)')).toBeInTheDocument();
    expect(screen.getByLabelText('行列 Out (N×M)')).toBeInTheDocument();
  });

  it('Backward図に転置行列が含まれる', () => {
    render(<AffineLayerExplanation />);
    expect(screen.getByLabelText(/行列 W.*M×D/)).toBeInTheDocument();
    expect(screen.getByLabelText(/行列 X.*D×N/)).toBeInTheDocument();
  });

  it('まとめテーブルに4行（out, dx, dW, db）がある', () => {
    const { container } = render(<AffineLayerExplanation />);
    const tables = container.querySelectorAll('table');
    const summaryTable = tables[tables.length - 1];
    const rows = summaryTable.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);
  });

  it('要点ボックスが表示される', () => {
    render(<AffineLayerExplanation />);
    expect(
      screen.getByText(/形状を見れば転置の有無と引数の順序がわかる/),
    ).toBeInTheDocument();
  });

  it('末尾に4択問題のdetailsが含まれない', () => {
    render(<AffineLayerExplanation />);
    expect(screen.queryByText('4択問題で確認する')).not.toBeInTheDocument();
  });
});
