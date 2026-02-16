import type {
  GlossarySection,
  GlossarySubsection,
  GlossaryTerm,
  GroupedTerms,
} from '@/types/glossary';

/**
 * 用語をクエリ文字列とセクションIDでフィルタする
 */
export function filterTerms(
  terms: GlossaryTerm[],
  query: string,
  sectionId: string | undefined
): GlossaryTerm[] {
  const lowerQuery = query.toLowerCase();

  return terms.filter((term) => {
    if (sectionId && term.sectionId !== sectionId) return false;
    if (!lowerQuery) return true;

    return (
      term.jaName.toLowerCase().includes(lowerQuery) ||
      term.enName.toLowerCase().includes(lowerQuery) ||
      term.description.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * 用語をセクション・サブセクション別にグループ化する
 */
export function groupTermsBySection(
  terms: GlossaryTerm[],
  sections: GlossarySection[],
  subsections: GlossarySubsection[]
): GroupedTerms[] {
  const result: GroupedTerms[] = [];

  for (const section of sections) {
    const sectionTerms = terms.filter((t) => t.sectionId === section.id);
    if (sectionTerms.length === 0) continue;

    const sectionSubs = subsections
      .filter((s) => s.sectionId === section.id)
      .map((sub) => ({
        subsection: sub,
        terms: sectionTerms.filter((t) => t.subsectionId === sub.id),
      }))
      .filter((group) => group.terms.length > 0);

    result.push({
      section,
      subsections: sectionSubs,
      termCount: sectionTerms.length,
    });
  }

  return result;
}
