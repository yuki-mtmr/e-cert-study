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
    // θ は FlowBox と SVG の両方に存在するので getAllByText を使用
    expect(screen.getAllByText('θ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('v_t')).toBeInTheDocument();
  });

  it('セクション1に更新式の導出解説が表示される', () => {
    render(<OptimizerExplanation />);
    expect(
      screen.getByText(/過去の勾配.*指数的に減衰.*加重平均/),
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
    // テーブルヘッダーに Momentum と NAG が含まれることを確認
    const thElements = container.querySelectorAll('th');
    const thTexts = Array.from(thElements).map((th) => th.textContent);
    expect(thTexts).toContainEqual('Momentum');
    expect(thTexts).toContainEqual('NAG');
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

  // セクション4: まとめ比較表
  it('セクション4にSGD/Momentum/NAGの3列比較表がある', () => {
    const { container } = render(<OptimizerExplanation />);
    // まとめテーブルのヘッダーに SGD が含まれることを確認
    const thElements = container.querySelectorAll('th');
    const thTexts = Array.from(thElements).map((th) => th.textContent);
    expect(thTexts).toContainEqual('SGD');
    // 本文セルにシンプル / 振動抑制 / 先読みが存在
    expect(screen.getByText('シンプル')).toBeInTheDocument();
    // 振動抑制 は複数箇所に出現しうるので getAllByText
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
