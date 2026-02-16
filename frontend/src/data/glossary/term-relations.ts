import type { SubsectionRelations } from '@/types/concept-map';
import { MATH_RELATIONS } from './relations-math';
import { ML_RELATIONS } from './relations-ml';
import { DL_BASIC_RELATIONS } from './relations-dl-basic';
import { DL_APP_RELATIONS } from './relations-dl-app';
import { DEVOPS_RELATIONS } from './relations-devops';

/** 全30サブセクションの関係データを統合した配列 */
export const ALL_RELATIONS: SubsectionRelations[] = [
  ...MATH_RELATIONS,
  ...ML_RELATIONS,
  ...DL_BASIC_RELATIONS,
  ...DL_APP_RELATIONS,
  ...DEVOPS_RELATIONS,
];

/** サブセクションIDから関係データを取得する */
export function getRelationsForSubsection(
  subsectionId: string,
): SubsectionRelations | undefined {
  return ALL_RELATIONS.find((r) => r.subsectionId === subsectionId);
}
