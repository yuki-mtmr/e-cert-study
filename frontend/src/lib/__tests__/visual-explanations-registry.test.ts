import { describe, it, expect } from 'vitest';
import { getVisualizations } from '@/lib/visual-explanations/registry';

describe('getVisualizations', () => {
  it('ml-issues サブセクションで1件のビジュアルを返す', () => {
    const result = getVisualizations('ml-issues');
    expect(result).toHaveLength(1);
  });

  it('ml-issues のビジュアルに必要なメタデータが含まれる', () => {
    const [viz] = getVisualizations('ml-issues');
    expect(viz.id).toBe('error-curve');
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
});
