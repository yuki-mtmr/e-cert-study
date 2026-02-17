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

  it('ml-metrics サブセクションで1件のビジュアルを返す', () => {
    const result = getVisualizations('ml-metrics');
    expect(result).toHaveLength(1);
  });

  it('ml-metrics のビジュアルに正しいメタデータが含まれる', () => {
    const [viz] = getVisualizations('ml-metrics');
    expect(viz.id).toBe('confusion-matrix');
    expect(viz.title).toBeTruthy();
    expect(viz.description).toBeTruthy();
    expect(viz.component).toBeDefined();
  });
});
