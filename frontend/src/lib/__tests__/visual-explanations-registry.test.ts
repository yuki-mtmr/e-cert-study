import { describe, it, expect } from 'vitest';
import { getVisualizations } from '@/lib/visual-explanations/registry';

describe('getVisualizations', () => {
  it('ml-issues サブセクションで2件のビジュアルを返す', () => {
    const result = getVisualizations('ml-issues');
    expect(result).toHaveLength(2);
  });

  it('ml-issues の1番目のビジュアルに必要なメタデータが含まれる', () => {
    const [viz] = getVisualizations('ml-issues');
    expect(viz.id).toBe('error-curve');
    expect(viz.title).toBeTruthy();
    expect(viz.description).toBeTruthy();
    expect(viz.component).toBeDefined();
  });

  it('ml-issues の2番目のビジュアル（バイアス-バリアンス）が含まれる', () => {
    const vizList = getVisualizations('ml-issues');
    const viz = vizList[1];
    expect(viz.id).toBe('bias-variance');
    expect(viz.title).toBeTruthy();
    expect(viz.description).toBeTruthy();
    expect(viz.component).toBeDefined();
  });

  it('未登録のサブセクションでは空配列を返す', () => {
    expect(getVisualizations('unknown-subsection')).toEqual([]);
  });

  it('別の登録済みでないサブセクションでも空配列を返す', () => {
    expect(getVisualizations('math-prob')).toEqual([]);
  });

  it('ml-validation サブセクションで1件のビジュアルを返す', () => {
    const result = getVisualizations('ml-validation');
    expect(result).toHaveLength(1);
  });

  it('ml-validation のビジュアルに正しいメタデータが含まれる', () => {
    const [viz] = getVisualizations('ml-validation');
    expect(viz.id).toBe('validation-comparison');
    expect(viz.title).toBeTruthy();
    expect(viz.description).toBeTruthy();
    expect(viz.component).toBeDefined();
  });

  it('ml-metrics サブセクションで4件のビジュアルを返す', () => {
    const result = getVisualizations('ml-metrics');
    expect(result).toHaveLength(4);
  });

  it('ml-metrics の1番目: confusion-matrix', () => {
    const vizList = getVisualizations('ml-metrics');
    expect(vizList[0].id).toBe('confusion-matrix');
    expect(vizList[0].title).toBeTruthy();
    expect(vizList[0].component).toBeDefined();
  });

  it('ml-metrics の2番目: roc-pr-curves', () => {
    const vizList = getVisualizations('ml-metrics');
    expect(vizList[1].id).toBe('roc-pr-curves');
    expect(vizList[1].title).toBeTruthy();
    expect(vizList[1].component).toBeDefined();
  });

  it('ml-metrics の3番目: micro-macro-average', () => {
    const vizList = getVisualizations('ml-metrics');
    expect(vizList[2].id).toBe('micro-macro-average');
    expect(vizList[2].title).toBeTruthy();
    expect(vizList[2].component).toBeDefined();
  });

  it('ml-metrics の4番目: metric-relationship-map', () => {
    const vizList = getVisualizations('ml-metrics');
    expect(vizList[3].id).toBe('metric-relationship-map');
    expect(vizList[3].title).toBeTruthy();
    expect(vizList[3].component).toBeDefined();
  });
});
