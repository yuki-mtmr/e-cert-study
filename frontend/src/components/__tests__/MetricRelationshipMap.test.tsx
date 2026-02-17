import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// KaTeXをモック
vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex">${formula}</span>`,
  },
}));

import { MetricRelationshipMap } from '../visual-explanations/MetricRelationshipMap';
import { getMetricNodes } from '@/lib/visual-explanations/metric-relationship-data';

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

  it('数式を持つノードのポップアップにKaTeX出力が含まれる', () => {
    const { container } = render(<MetricRelationshipMap />);
    const node = screen.getByTestId('node-precision');
    fireEvent.click(node);
    const popup = screen.getByTestId('node-popup');
    const katexEl = popup.querySelector('.katex');
    expect(katexEl).toBeInTheDocument();
  });

  it('凡例を表示する', () => {
    render(<MetricRelationshipMap />);
    expect(screen.getByText('混同行列要素')).toBeInTheDocument();
  });

  it('precisionノードクリック時、接続エッジが正しくハイライトされる', () => {
    const { container } = render(<MetricRelationshipMap />);
    const node = screen.getByTestId('node-precision');
    fireEvent.click(node);

    const edge8 = container.querySelector('[data-testid="edge-8"]');
    expect(edge8?.getAttribute('stroke')).toBe('#F59E0B');
    const edge12 = container.querySelector('[data-testid="edge-12"]');
    expect(edge12?.getAttribute('stroke')).toBe('#F59E0B');
    const edge2 = container.querySelector('[data-testid="edge-2"]');
    expect(edge2?.getAttribute('stroke')).not.toBe('#F59E0B');
  });
});

describe('metric-relationship-data latexFormula', () => {
  it('数式を持つノードにlatexFormulaが設定されている', () => {
    const nodes = getMetricNodes();
    const nodesWithFormula = nodes.filter((n) => n.formula !== '');
    for (const node of nodesWithFormula) {
      expect(node.latexFormula).toBeTruthy();
    }
  });

  it('precisionのlatexFormulaに\\fracが含まれる', () => {
    const nodes = getMetricNodes();
    const precision = nodes.find((n) => n.id === 'precision');
    expect(precision?.latexFormula).toContain('\\frac');
  });
});
