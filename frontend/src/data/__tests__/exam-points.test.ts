import { describe, it, expect } from 'vitest';
import { getExamPoints, ALL_EXAM_POINTS } from '../glossary/exam-points';
import { MATH_TERMS } from '../glossary/terms-math';
import { ML_TERMS } from '../glossary/terms-ml';
import { DL_BASIC_TERMS } from '../glossary/terms-dl-basic';
import { DL_APP_TERMS } from '../glossary/terms-dl-app';
import { DEVOPS_TERMS } from '../glossary/terms-devops';

const ALL_TERMS = [
  ...MATH_TERMS,
  ...ML_TERMS,
  ...DL_BASIC_TERMS,
  ...DL_APP_TERMS,
  ...DEVOPS_TERMS,
];

const ALL_TERM_IDS = new Set(ALL_TERMS.map((t) => t.id));

describe('exam-points データ整合性', () => {
  it('全用語の試験ポイントが存在する', () => {
    for (const termId of ALL_TERM_IDS) {
      const result = getExamPoints(termId);
      expect(result, `${termId} の試験ポイントが見つからない`).toBeDefined();
    }
  });

  it('全ての試験ポイントが実在する用語IDを参照している', () => {
    for (const ep of ALL_EXAM_POINTS) {
      expect(
        ALL_TERM_IDS.has(ep.termId),
        `termId="${ep.termId}" が用語データに存在しない`,
      ).toBe(true);
    }
  });

  it('各用語に1〜4個のポイントがある', () => {
    for (const ep of ALL_EXAM_POINTS) {
      expect(
        ep.points.length,
        `${ep.termId} のポイント数が0`,
      ).toBeGreaterThanOrEqual(1);
      expect(
        ep.points.length,
        `${ep.termId} のポイント数が5以上`,
      ).toBeLessThanOrEqual(4);
    }
  });

  it('termIdの重複がない', () => {
    const seen = new Set<string>();
    for (const ep of ALL_EXAM_POINTS) {
      expect(seen.has(ep.termId), `重複: ${ep.termId}`).toBe(false);
      seen.add(ep.termId);
    }
  });

  it('formulaが設定されている場合は空文字でない', () => {
    for (const ep of ALL_EXAM_POINTS) {
      if (ep.formula !== undefined) {
        expect(
          ep.formula.length,
          `${ep.termId} のformulaが空`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('getExamPointsが存在しないIDでundefinedを返す', () => {
    expect(getExamPoints('non-existent-term')).toBeUndefined();
  });
});
