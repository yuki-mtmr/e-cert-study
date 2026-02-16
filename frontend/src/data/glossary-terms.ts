/**
 * E資格用語集データ（re-export）
 * シラバス2024に基づく全用語
 */
export { SECTIONS, SUBSECTIONS } from './glossary/sections';
import { MATH_TERMS } from './glossary/terms-math';
import { ML_TERMS } from './glossary/terms-ml';
import { DL_BASIC_TERMS } from './glossary/terms-dl-basic';
import { DL_APP_TERMS } from './glossary/terms-dl-app';
import { DEVOPS_TERMS } from './glossary/terms-devops';
import type { GlossaryTerm } from '@/types/glossary';

export const TERMS: GlossaryTerm[] = [
  ...MATH_TERMS,
  ...ML_TERMS,
  ...DL_BASIC_TERMS,
  ...DL_APP_TERMS,
  ...DEVOPS_TERMS,
];
