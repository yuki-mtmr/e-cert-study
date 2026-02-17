/**
 * 用語集の型定義
 */

/** セクション（大分類） */
export interface GlossarySection {
  id: string;
  name: string;
  emoji: string;
}

/** サブセクション（中分類） */
export interface GlossarySubsection {
  id: string;
  name: string;
  sectionId: string;
}

/** 用語 */
export interface GlossaryTerm {
  id: string;
  jaName: string;
  enName: string;
  description: string;
  sectionId: string;
  subsectionId: string;
}

/** 用語の試験ポイント */
export interface TermExamPoints {
  termId: string;
  points: string[];
  formula?: string;
}

/** セクション別グループ化結果 */
export interface GroupedTerms {
  section: GlossarySection;
  subsections: {
    subsection: GlossarySubsection;
    terms: GlossaryTerm[];
  }[];
  termCount: number;
}
