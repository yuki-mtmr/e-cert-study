import type { ConceptMapMeta } from '@/types/concept-map';

export const CONCEPT_MAPS: ConceptMapMeta[] = [
  {
    id: 'overview',
    title: 'E資格 全体マップ',
    description: '5分野の関係性と学習順序',
    svgPath: '/concept-maps/overview.svg',
  },
  {
    id: 'math',
    title: '応用数学',
    description: '確率・統計・情報理論・線形代数の関係',
    svgPath: '/concept-maps/math.svg',
  },
  {
    id: 'ml',
    title: '機械学習',
    description: 'パターン認識から性能評価までの流れ',
    svgPath: '/concept-maps/ml.svg',
  },
  {
    id: 'dl-basic',
    title: '深層学習の基礎',
    description: 'ネットワーク構造・最適化・正則化の関係',
    svgPath: '/concept-maps/dl-basic.svg',
  },
  {
    id: 'dl-app',
    title: '深層学習の応用',
    description: '画像・NLP・生成・強化学習の全体像',
    svgPath: '/concept-maps/dl-app.svg',
  },
  {
    id: 'devops',
    title: '開発・運用環境',
    description: 'フレームワーク・軽量化・実行環境',
    svgPath: '/concept-maps/devops.svg',
  },
];

/** overviewマップを取得（フォールバック用） */
const OVERVIEW_MAP = CONCEPT_MAPS[0];

/**
 * セクションIDに対応するコンセプトマップを取得
 * @param sectionId - セクションID（未指定でoverviewを返す）
 */
export function getConceptMap(sectionId?: string): ConceptMapMeta {
  if (!sectionId) return OVERVIEW_MAP;
  return CONCEPT_MAPS.find((m) => m.id === sectionId) ?? OVERVIEW_MAP;
}

/**
 * セクションIDに対応するコンセプトマップを取得
 * @param sectionId - セクションID
 */
export function getMapForSection(sectionId: string): ConceptMapMeta {
  return CONCEPT_MAPS.find((m) => m.id === sectionId) ?? OVERVIEW_MAP;
}
