import { describe, it, expect } from 'vitest';
import {
  getMetricNodes,
  getMetricEdges,
  getCategoryColor,
} from '@/lib/visual-explanations/metric-relationship-data';
import type { MetricCategory } from '@/lib/visual-explanations/metric-relationship-data';

describe('getMetricNodes', () => {
  it('ノードを10個以上返す', () => {
    const nodes = getMetricNodes();
    expect(nodes.length).toBeGreaterThanOrEqual(10);
  });

  it('各ノードに必要なプロパティがある', () => {
    const nodes = getMetricNodes();
    for (const node of nodes) {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('enLabel');
      expect(node).toHaveProperty('category');
      expect(node).toHaveProperty('x');
      expect(node).toHaveProperty('y');
      expect(node).toHaveProperty('formula');
      expect(node).toHaveProperty('description');
    }
  });

  it('IDが全てユニーク', () => {
    const nodes = getMetricNodes();
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(nodes.length);
  });

  it('座標が0~1の範囲', () => {
    const nodes = getMetricNodes();
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(1);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(1);
    }
  });
});

describe('getMetricEdges', () => {
  it('エッジを10個以上返す', () => {
    const edges = getMetricEdges();
    expect(edges.length).toBeGreaterThanOrEqual(10);
  });

  it('各エッジのfrom/toが存在するノードを参照する', () => {
    const nodes = getMetricNodes();
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = getMetricEdges();
    for (const edge of edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it('各エッジにlabelがある', () => {
    const edges = getMetricEdges();
    for (const edge of edges) {
      expect(edge.label).toBeTruthy();
    }
  });
});

describe('getCategoryColor', () => {
  it('全カテゴリに色を返す', () => {
    const categories: MetricCategory[] = ['base', 'rate', 'composite', 'curve'];
    for (const cat of categories) {
      const color = getCategoryColor(cat);
      expect(color).toBeTruthy();
      expect(typeof color).toBe('string');
    }
  });
});
