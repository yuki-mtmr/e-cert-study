import { describe, it, expect } from 'vitest';
import {
  getValidationSummary,
  getComparisonRows,
} from '@/lib/visual-explanations/validation-comparison';
import type {
  SummaryBullet,
  ComparisonRow,
} from '@/lib/visual-explanations/validation-comparison';

describe('getValidationSummary', () => {
  it('2件のサマリーを返す', () => {
    const result = getValidationSummary();
    expect(result).toHaveLength(2);
  });

  it('各サマリーに method と summary プロパティがある', () => {
    const result = getValidationSummary();
    result.forEach((bullet: SummaryBullet) => {
      expect(bullet.method).toBeTruthy();
      expect(bullet.summary).toBeTruthy();
    });
  });

  it('ホールドアウトと k-分割交差検証を含む', () => {
    const result = getValidationSummary();
    const methods = result.map((b: SummaryBullet) => b.method);
    expect(methods).toContain('ホールドアウト');
    expect(methods).toContain('k-分割交差検証');
  });
});

describe('getComparisonRows', () => {
  it('5行の比較データを返す', () => {
    const result = getComparisonRows();
    expect(result).toHaveLength(5);
  });

  it('各行に category, holdout, kFold プロパティがある', () => {
    const result = getComparisonRows();
    result.forEach((row: ComparisonRow) => {
      expect(row.category).toBeTruthy();
      expect(row.holdout).toBeTruthy();
      expect(row.kFold).toBeTruthy();
    });
  });

  it('比較軸に「分割回数」「評価の安定性」「計算コスト」「データの利用効率」「適した場面」を含む', () => {
    const result = getComparisonRows();
    const categories = result.map((r: ComparisonRow) => r.category);
    expect(categories).toContain('分割回数');
    expect(categories).toContain('評価の安定性');
    expect(categories).toContain('計算コスト');
    expect(categories).toContain('データの利用効率');
    expect(categories).toContain('適した場面');
  });
});
