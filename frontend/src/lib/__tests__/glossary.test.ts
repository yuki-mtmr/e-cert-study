import { describe, it, expect } from 'vitest';
import { filterTerms, groupTermsBySection } from '../glossary';
import type { GlossarySection, GlossarySubsection, GlossaryTerm } from '@/types/glossary';

const sections: GlossarySection[] = [
  { id: 'math', name: '応用数学', emoji: '📐' },
  { id: 'ml', name: '機械学習', emoji: '🤖' },
];

const subsections: GlossarySubsection[] = [
  { id: 'math-prob', name: '確率・統計', sectionId: 'math' },
  { id: 'math-info', name: '情報理論', sectionId: 'math' },
  { id: 'ml-pattern', name: 'パターン認識', sectionId: 'ml' },
];

const terms: GlossaryTerm[] = [
  {
    id: 'bayes',
    jaName: 'ベイズの定理',
    enName: "Bayes' Theorem",
    description: '条件付き確率を計算する定理。',
    sectionId: 'math',
    subsectionId: 'math-prob',
  },
  {
    id: 'entropy',
    jaName: 'エントロピー',
    enName: 'Entropy',
    description: '情報の不確実性を測る指標。',
    sectionId: 'math',
    subsectionId: 'math-info',
  },
  {
    id: 'knn',
    jaName: 'k近傍法',
    enName: 'k-Nearest Neighbors',
    description: '最も近いk個のデータで分類する手法。',
    sectionId: 'ml',
    subsectionId: 'ml-pattern',
  },
  {
    id: 'svm',
    jaName: 'サポートベクターマシン',
    enName: 'Support Vector Machine',
    description: 'マージンを最大化する分類器。',
    sectionId: 'ml',
    subsectionId: 'ml-pattern',
  },
];

describe('filterTerms', () => {
  it('空クエリ・フィルタなしで全用語を返す', () => {
    const result = filterTerms(terms, '', undefined);
    expect(result).toHaveLength(4);
  });

  it('jaNameで検索できる', () => {
    const result = filterTerms(terms, 'ベイズ', undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bayes');
  });

  it('enNameで検索できる', () => {
    const result = filterTerms(terms, 'Entropy', undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entropy');
  });

  it('descriptionで検索できる', () => {
    const result = filterTerms(terms, 'マージン', undefined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('svm');
  });

  it('大文字小文字を区別しない', () => {
    const result = filterTerms(terms, 'entropy', undefined);
    expect(result).toHaveLength(1);
  });

  it('sectionIdでフィルタできる', () => {
    const result = filterTerms(terms, '', 'ml');
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.sectionId === 'ml')).toBe(true);
  });

  it('クエリとsectionIdの複合フィルタ', () => {
    const result = filterTerms(terms, 'k近傍', 'ml');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('knn');
  });

  it('該当なしで空配列を返す', () => {
    const result = filterTerms(terms, '存在しない用語', undefined);
    expect(result).toHaveLength(0);
  });
});

describe('groupTermsBySection', () => {
  it('セクション別にグループ化する', () => {
    const result = groupTermsBySection(terms, sections, subsections);
    expect(result).toHaveLength(2);
  });

  it('各グループにセクション情報がある', () => {
    const result = groupTermsBySection(terms, sections, subsections);
    expect(result[0].section.id).toBe('math');
    expect(result[1].section.id).toBe('ml');
  });

  it('termCountが正しい', () => {
    const result = groupTermsBySection(terms, sections, subsections);
    const mathGroup = result.find((g) => g.section.id === 'math');
    const mlGroup = result.find((g) => g.section.id === 'ml');
    expect(mathGroup?.termCount).toBe(2);
    expect(mlGroup?.termCount).toBe(2);
  });

  it('サブセクション別に用語が分類される', () => {
    const result = groupTermsBySection(terms, sections, subsections);
    const mathGroup = result.find((g) => g.section.id === 'math');
    expect(mathGroup?.subsections).toHaveLength(2);
    expect(mathGroup?.subsections[0].subsection.id).toBe('math-prob');
    expect(mathGroup?.subsections[0].terms).toHaveLength(1);
    expect(mathGroup?.subsections[1].subsection.id).toBe('math-info');
    expect(mathGroup?.subsections[1].terms).toHaveLength(1);
  });

  it('用語がないセクションは含まれない', () => {
    const extraSections = [
      ...sections,
      { id: 'empty', name: '空セクション', emoji: '❌' },
    ];
    const result = groupTermsBySection(terms, extraSections, subsections);
    expect(result).toHaveLength(2);
    expect(result.find((g) => g.section.id === 'empty')).toBeUndefined();
  });
});
