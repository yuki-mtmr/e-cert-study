import type { TermExamPoints } from '@/types/glossary';
import { MATH_EXAM_POINTS } from './exam-points-math';
import { ML_EXAM_POINTS } from './exam-points-ml';
import { DL_BASIC_EXAM_POINTS } from './exam-points-dl-basic';
import { DL_APP_EXAM_POINTS } from './exam-points-dl-app';
import { DEVOPS_EXAM_POINTS } from './exam-points-devops';

/** 全用語の試験ポイントを統合した配列 */
export const ALL_EXAM_POINTS: TermExamPoints[] = [
  ...MATH_EXAM_POINTS,
  ...ML_EXAM_POINTS,
  ...DL_BASIC_EXAM_POINTS,
  ...DL_APP_EXAM_POINTS,
  ...DEVOPS_EXAM_POINTS,
];

const examPointsMap = new Map(ALL_EXAM_POINTS.map((ep) => [ep.termId, ep]));

/** 用語IDから試験ポイントを取得する */
export function getExamPoints(termId: string): TermExamPoints | undefined {
  return examPointsMap.get(termId);
}
