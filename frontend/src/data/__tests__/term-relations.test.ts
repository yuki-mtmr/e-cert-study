import { describe, it, expect } from 'vitest';
import { getRelationsForSubsection, ALL_RELATIONS } from '../glossary/term-relations';
import { SUBSECTIONS } from '../glossary/sections';
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

describe('term-relations データ整合性', () => {
  it('全30サブセクションの関係データが存在する', () => {
    const subsectionIds = SUBSECTIONS.map((s) => s.id);
    for (const id of subsectionIds) {
      const result = getRelationsForSubsection(id);
      expect(result, `${id} の関係データが見つからない`).toBeDefined();
      expect(result!.subsectionId).toBe(id);
    }
  });

  it('ALL_RELATIONSが30件ある', () => {
    expect(ALL_RELATIONS).toHaveLength(30);
  });

  it('全ての関係のfrom/toが実在する用語IDを参照している', () => {
    for (const sr of ALL_RELATIONS) {
      const termsInSubsection = new Set(
        ALL_TERMS.filter((t) => t.subsectionId === sr.subsectionId).map((t) => t.id),
      );
      for (const rel of sr.relations) {
        expect(
          termsInSubsection.has(rel.from),
          `${sr.subsectionId}: from="${rel.from}" がサブセクション内に存在しない`,
        ).toBe(true);
        expect(
          termsInSubsection.has(rel.to),
          `${sr.subsectionId}: to="${rel.to}" がサブセクション内に存在しない`,
        ).toBe(true);
      }
    }
  });

  it('自己参照する関係がない', () => {
    for (const sr of ALL_RELATIONS) {
      for (const rel of sr.relations) {
        expect(
          rel.from !== rel.to,
          `${sr.subsectionId}: 自己参照 ${rel.from} → ${rel.to}`,
        ).toBe(true);
      }
    }
  });

  it('同じfrom-toペアの重複関係がない', () => {
    for (const sr of ALL_RELATIONS) {
      const seen = new Set<string>();
      for (const rel of sr.relations) {
        const key = `${rel.from}->${rel.to}`;
        expect(seen.has(key), `${sr.subsectionId}: 重複関係 ${key}`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('各サブセクションに少なくとも1つの関係がある', () => {
    for (const sr of ALL_RELATIONS) {
      expect(
        sr.relations.length,
        `${sr.subsectionId} に関係がない`,
      ).toBeGreaterThan(0);
    }
  });

  it('関係のtypeが有効な値のみ', () => {
    const validTypes = ['prerequisite', 'variant', 'component', 'applies'];
    for (const sr of ALL_RELATIONS) {
      for (const rel of sr.relations) {
        expect(validTypes).toContain(rel.type);
      }
    }
  });
});
