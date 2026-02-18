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

  it('ml-metrics サブセクションで5件のビジュアルを返す', () => {
    const result = getVisualizations('ml-metrics');
    expect(result).toHaveLength(5);
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

  it('ml-metrics の5番目: regression-metrics', () => {
    const vizList = getVisualizations('ml-metrics');
    expect(vizList[4].id).toBe('regression-metrics');
    expect(vizList[4].title).toBeTruthy();
    expect(vizList[4].description).toBeTruthy();
    expect(vizList[4].component).toBeDefined();
  });

  it('dl-loss サブセクションで3件のビジュアルを返す', () => {
    const result = getVisualizations('dl-loss');
    expect(result).toHaveLength(3);
  });

  it('dl-loss の1番目: loss-activation-guide', () => {
    const vizList = getVisualizations('dl-loss');
    expect(vizList[0].id).toBe('loss-activation-guide');
    expect(vizList[0].title).toBeTruthy();
    expect(vizList[0].description).toBeTruthy();
    expect(vizList[0].component).toBeDefined();
  });

  it('dl-loss の2番目: softmax-with-loss-explanation', () => {
    const vizList = getVisualizations('dl-loss');
    expect(vizList[1].id).toBe('softmax-with-loss-explanation');
    expect(vizList[1].title).toBeTruthy();
    expect(vizList[1].description).toBeTruthy();
    expect(vizList[1].component).toBeDefined();
  });

  it('dl-loss の3番目: exam-q4-softmax-loss', () => {
    const vizList = getVisualizations('dl-loss');
    expect(vizList[2].id).toBe('exam-q4-softmax-loss');
    expect(vizList[2].title).toBeTruthy();
    expect(vizList[2].description).toBeTruthy();
    expect(vizList[2].component).toBeDefined();
  });

  it('dl-activation サブセクションで3件のビジュアルを返す', () => {
    const result = getVisualizations('dl-activation');
    expect(result).toHaveLength(3);
  });

  it('dl-activation の1番目: activation-function-explorer', () => {
    const vizList = getVisualizations('dl-activation');
    expect(vizList[0].id).toBe('activation-function-explorer');
    expect(vizList[0].title).toBeTruthy();
    expect(vizList[0].description).toBeTruthy();
    expect(vizList[0].component).toBeDefined();
  });

  it('dl-activation の2番目: activation-backward-explanation', () => {
    const vizList = getVisualizations('dl-activation');
    expect(vizList[1].id).toBe('activation-backward-explanation');
    expect(vizList[1].title).toBeTruthy();
    expect(vizList[1].description).toBeTruthy();
    expect(vizList[1].component).toBeDefined();
  });

  it('dl-activation の3番目: exam-q5-activation-backward', () => {
    const vizList = getVisualizations('dl-activation');
    expect(vizList[2].id).toBe('exam-q5-activation-backward');
    expect(vizList[2].title).toBeTruthy();
    expect(vizList[2].description).toBeTruthy();
    expect(vizList[2].component).toBeDefined();
  });

  it('dl-ffnn サブセクションで2件のビジュアルを返す', () => {
    const result = getVisualizations('dl-ffnn');
    expect(result).toHaveLength(2);
  });

  it('dl-ffnn の1番目: affine-layer-explanation', () => {
    const vizList = getVisualizations('dl-ffnn');
    expect(vizList[0].id).toBe('affine-layer-explanation');
    expect(vizList[0].title).toBeTruthy();
    expect(vizList[0].description).toBeTruthy();
    expect(vizList[0].component).toBeDefined();
  });

  it('dl-ffnn の2番目: exam-q6-affine-layer', () => {
    const vizList = getVisualizations('dl-ffnn');
    expect(vizList[1].id).toBe('exam-q6-affine-layer');
    expect(vizList[1].title).toBeTruthy();
    expect(vizList[1].description).toBeTruthy();
    expect(vizList[1].component).toBeDefined();
  });

  it('dl-optimizer サブセクションで2件のビジュアルを返す', () => {
    const result = getVisualizations('dl-optimizer');
    expect(result).toHaveLength(2);
  });

  it('dl-optimizer の1番目: optimizer-explanation', () => {
    const vizList = getVisualizations('dl-optimizer');
    expect(vizList[0].id).toBe('optimizer-explanation');
    expect(vizList[0].title).toBeTruthy();
    expect(vizList[0].description).toBeTruthy();
    expect(vizList[0].component).toBeDefined();
  });

  it('dl-optimizer の2番目: exam-q8-optimizer', () => {
    const vizList = getVisualizations('dl-optimizer');
    expect(vizList[1].id).toBe('exam-q8-optimizer');
    expect(vizList[1].title).toBeTruthy();
    expect(vizList[1].description).toBeTruthy();
    expect(vizList[1].component).toBeDefined();
  });
});
