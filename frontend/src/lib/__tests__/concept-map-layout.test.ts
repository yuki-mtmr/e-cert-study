import { describe, it, expect } from 'vitest';
import { computeLayout } from '../concept-map-layout';
import type { TermRelation } from '@/types/concept-map';

describe('computeLayout', () => {
  it('孤立ノードのみの場合、全ノードがlevel 0に配置される', () => {
    const termIds = ['a', 'b', 'c'];
    const relations: TermRelation[] = [];
    const result = computeLayout(termIds, relations);

    expect(result.nodes).toHaveLength(3);
    for (const node of result.nodes) {
      expect(node.level).toBe(0);
    }
  });

  it('線形チェーン a→b→c で正しい階層が割り当てられる', () => {
    const termIds = ['a', 'b', 'c'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
      { from: 'b', to: 'c', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);

    const nodeMap = new Map(result.nodes.map((n) => [n.termId, n]));
    expect(nodeMap.get('a')!.level).toBe(0);
    expect(nodeMap.get('b')!.level).toBe(1);
    expect(nodeMap.get('c')!.level).toBe(2);
  });

  it('ダイヤモンド形 a→b,a→c,b→d,c→d で正しい階層', () => {
    const termIds = ['a', 'b', 'c', 'd'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
      { from: 'a', to: 'c', type: 'prerequisite' },
      { from: 'b', to: 'd', type: 'prerequisite' },
      { from: 'c', to: 'd', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);

    const nodeMap = new Map(result.nodes.map((n) => [n.termId, n]));
    expect(nodeMap.get('a')!.level).toBe(0);
    expect(nodeMap.get('b')!.level).toBe(1);
    expect(nodeMap.get('c')!.level).toBe(1);
    expect(nodeMap.get('d')!.level).toBe(2);
  });

  it('edgesの数がrelationsの数と一致する', () => {
    const termIds = ['a', 'b', 'c'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
      { from: 'a', to: 'c', type: 'variant', label: 'test' },
    ];
    const result = computeLayout(termIds, relations);

    expect(result.edges).toHaveLength(2);
    expect(result.edges[0].type).toBe('prerequisite');
    expect(result.edges[1].type).toBe('variant');
    expect(result.edges[1].label).toBe('test');
  });

  it('各エッジのpointsが2点以上持つ（ベジェ曲線制御点）', () => {
    const termIds = ['a', 'b'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);

    for (const edge of result.edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('width/heightが正の値を持つ', () => {
    const termIds = ['a', 'b'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('同一階層のノードが水平方向に異なるx座標を持つ', () => {
    const termIds = ['root', 'a', 'b', 'c'];
    const relations: TermRelation[] = [
      { from: 'root', to: 'a', type: 'prerequisite' },
      { from: 'root', to: 'b', type: 'prerequisite' },
      { from: 'root', to: 'c', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);

    const level1Nodes = result.nodes.filter((n) => n.level === 1);
    expect(level1Nodes).toHaveLength(3);

    const xValues = level1Nodes.map((n) => n.x);
    const uniqueX = new Set(xValues);
    expect(uniqueX.size).toBe(3);
  });

  it('空の入力でも空のLayoutResultを返す', () => {
    const result = computeLayout([], []);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('循環がある場合もエラーにならない', () => {
    const termIds = ['a', 'b'];
    const relations: TermRelation[] = [
      { from: 'a', to: 'b', type: 'prerequisite' },
      { from: 'b', to: 'a', type: 'prerequisite' },
    ];
    const result = computeLayout(termIds, relations);
    expect(result.nodes).toHaveLength(2);
  });
});
