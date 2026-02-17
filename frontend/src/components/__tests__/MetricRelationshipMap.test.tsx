import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricRelationshipMap } from '../visual-explanations/MetricRelationshipMap';

describe('MetricRelationshipMap', () => {
  it('SVGを描画する', () => {
    render(<MetricRelationshipMap />);
    const svg = screen.getByRole('img', { name: /評価指標の関係/ });
    expect(svg).toBeInTheDocument();
  });

  it('ノードを表示する', () => {
    const { container } = render(<MetricRelationshipMap />);
    const nodeGroups = container.querySelectorAll('[data-testid^="node-"]');
    expect(nodeGroups.length).toBeGreaterThanOrEqual(10);
  });

  it('エッジ（line要素）を描画する', () => {
    const { container } = render(<MetricRelationshipMap />);
    const lines = container.querySelectorAll('line[data-testid^="edge-"]');
    expect(lines.length).toBeGreaterThanOrEqual(10);
  });

  it('ノードクリックでポップアップが表示される', () => {
    render(<MetricRelationshipMap />);
    const node = screen.getByTestId('node-precision');
    fireEvent.click(node);
    expect(screen.getByTestId('node-popup')).toBeInTheDocument();
  });

  it('ポップアップに数式と説明が含まれる', () => {
    render(<MetricRelationshipMap />);
    const node = screen.getByTestId('node-precision');
    fireEvent.click(node);
    const popup = screen.getByTestId('node-popup');
    expect(popup.textContent).toContain('適合率');
  });

  it('凡例を表示する', () => {
    render(<MetricRelationshipMap />);
    expect(screen.getByText('混同行列要素')).toBeInTheDocument();
  });

  it('precisionノードクリック時、接続エッジが正しくハイライトされる', () => {
    const { container } = render(<MetricRelationshipMap />);
    const node = screen.getByTestId('node-precision');
    fireEvent.click(node);

    // precision に接続するエッジの元インデックス:
    // edge-0: tp→precision, edge-1: fp→precision, edge-8: precision→f1,
    // edge-12: precision→pr, edge-17: precision→macro
    // edge-8 (precision→f1) がハイライトされていること（バグ時はされない）
    const edge8 = container.querySelector('[data-testid="edge-8"]');
    expect(edge8?.getAttribute('stroke')).toBe('#F59E0B');
    // edge-12 (precision→pr) もハイライト
    const edge12 = container.querySelector('[data-testid="edge-12"]');
    expect(edge12?.getAttribute('stroke')).toBe('#F59E0B');
    // edge-2 (tp→recall) はprecisionに無関係なのでハイライトされない
    const edge2 = container.querySelector('[data-testid="edge-2"]');
    expect(edge2?.getAttribute('stroke')).not.toBe('#F59E0B');
  });
});
