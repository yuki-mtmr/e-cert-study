import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizerExplanation } from '../visual-explanations/OptimizerExplanation';

describe('OptimizerExplanation', () => {
  it('4つのセクション見出しを描画する', () => {
    const { container } = render(<OptimizerExplanation />);
    const headings = container.querySelectorAll('h3');
    const texts = Array.from(headings).map((h) => h.textContent);
    expect(texts).toContainEqual(expect.stringContaining('Momentum更新式'));
    expect(texts).toContainEqual(expect.stringContaining('NAG'));
    expect(texts).toContainEqual(
      expect.stringContaining('Pathological Curvature'),
    );
    expect(texts).toContainEqual(expect.stringContaining('まとめ'));
  });

  // セクション1: Momentum更新式
  it('セクション1にFlowBoxで更新式フローが描画される', () => {
    render(<OptimizerExplanation />);
    expect(screen.getAllByText('θ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('v_t')).toBeInTheDocument();
  });

  it('セクション1に更新式の導出解説が表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/過去の勾配.*指数的に減衰.*加重平均/),
    ).toBeInTheDocument();
  });

  it('セクション1に消去法テーブルがある（4行）', () => {
    const { container } = render(<OptimizerExplanation />);
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
    const firstTable = tables[0];
    const rows = firstTable.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(4);
  });

  it('セクション1に判別のコツboxが表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/γ.*0\.9.*v.*η.*0\.01.*∇J.*大小関係/),
    ).toBeInTheDocument();
  });

  // セクション2: NAG先読み
  it('セクション2にSVG等高線図がある', () => {
    const { container } = render(<OptimizerExplanation />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('セクション2にMomentum vs NAG比較テーブルがある', () => {
    const { container } = render(<OptimizerExplanation />);
    const thElements = container.querySelectorAll('th');
    const thTexts = Array.from(thElements).map((th) => th.textContent);
    expect(thTexts).toContainEqual('Momentum');
    expect(thTexts).toContainEqual('NAG');
  });

  it('セクション2に即答ポイントが表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/∇J.*引数.*θでない.*D.*即答/),
    ).toBeInTheDocument();
  });

  // セクション3: Pathological Curvature
  it('セクション3にSVG軌跡図がある（SGD振動 + Momentum減衰）', () => {
    const { container } = render(<OptimizerExplanation />);
    const polylines = container.querySelectorAll('polyline');
    expect(polylines.length).toBeGreaterThanOrEqual(2);
  });

  it('セクション3にPCの本質解説が表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/振動.*局所最小値.*異なる/),
    ).toBeInTheDocument();
  });

  it('セクション3に選択肢分析テーブルがある', () => {
    render(<OptimizerExplanation />);
    expect(screen.getByText('不適切')).toBeInTheDocument();
  });

  it('セクション3に判別のコツが表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/振動.*収束遅延.*局所最小値.*別の現象/),
    ).toBeInTheDocument();
  });

  // セクション4: まとめ比較表
  it('セクション4にSGD/Momentum/NAGの3列比較表がある', () => {
    const { container } = render(<OptimizerExplanation />);
    const thElements = container.querySelectorAll('th');
    const thTexts = Array.from(thElements).map((th) => th.textContent);
    expect(thTexts).toContainEqual('SGD');
    expect(screen.getByText('シンプル')).toBeInTheDocument();
    expect(screen.getAllByText(/振動抑制/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/先読み/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  // 4択問題のdetailsが含まれないことを確認
  it('末尾に4択問題のdetailsが含まれない', () => {
    render(<OptimizerExplanation />);
    expect(screen.queryByText('4択問題で確認する')).not.toBeInTheDocument();
  });
});
