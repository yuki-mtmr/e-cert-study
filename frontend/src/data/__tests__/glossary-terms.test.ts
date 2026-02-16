import { describe, it, expect } from 'vitest';
import { SECTIONS, SUBSECTIONS, TERMS } from '../glossary-terms';

describe('glossary-terms データ整合性', () => {
  it('5つのセクションが存在する', () => {
    expect(SECTIONS).toHaveLength(5);
  });

  it('各セクションに必須フィールドがある', () => {
    for (const section of SECTIONS) {
      expect(section.id).toBeTruthy();
      expect(section.name).toBeTruthy();
      expect(section.emoji).toBeTruthy();
    }
  });

  it('セクションIDが一意である', () => {
    const ids = SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('サブセクションが存在する', () => {
    expect(SUBSECTIONS.length).toBeGreaterThan(0);
  });

  it('各サブセクションに必須フィールドがある', () => {
    for (const sub of SUBSECTIONS) {
      expect(sub.id).toBeTruthy();
      expect(sub.name).toBeTruthy();
      expect(sub.sectionId).toBeTruthy();
    }
  });

  it('サブセクションIDが一意である', () => {
    const ids = SUBSECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全サブセクションのsectionIdが有効なセクションを参照する', () => {
    const sectionIds = new Set(SECTIONS.map((s) => s.id));
    for (const sub of SUBSECTIONS) {
      expect(sectionIds.has(sub.sectionId)).toBe(true);
    }
  });

  it('300以上の用語が存在する', () => {
    expect(TERMS.length).toBeGreaterThanOrEqual(300);
  });

  it('各用語に必須フィールドがある', () => {
    for (const term of TERMS) {
      expect(term.id).toBeTruthy();
      expect(term.jaName).toBeTruthy();
      expect(term.enName).toBeTruthy();
      expect(term.description).toBeTruthy();
      expect(term.sectionId).toBeTruthy();
      expect(term.subsectionId).toBeTruthy();
    }
  });

  it('用語IDが一意である', () => {
    const ids = TERMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('全用語のsectionIdが有効なセクションを参照する', () => {
    const sectionIds = new Set(SECTIONS.map((s) => s.id));
    for (const term of TERMS) {
      expect(sectionIds.has(term.sectionId)).toBe(true);
    }
  });

  it('全用語のsubsectionIdが有効なサブセクションを参照する', () => {
    const subsectionIds = new Set(SUBSECTIONS.map((s) => s.id));
    for (const term of TERMS) {
      expect(subsectionIds.has(term.subsectionId)).toBe(true);
    }
  });

  it('全セクションに少なくとも1つのサブセクションがある', () => {
    for (const section of SECTIONS) {
      const subs = SUBSECTIONS.filter((s) => s.sectionId === section.id);
      expect(subs.length).toBeGreaterThan(0);
    }
  });

  it('全サブセクションに少なくとも1つの用語がある', () => {
    for (const sub of SUBSECTIONS) {
      const terms = TERMS.filter((t) => t.subsectionId === sub.id);
      expect(terms.length).toBeGreaterThan(0);
    }
  });
});
