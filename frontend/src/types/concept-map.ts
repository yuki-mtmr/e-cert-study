/**
 * コンセプトマップの型定義
 */

/** コンセプトマップのメタデータ */
export interface ConceptMapMeta {
  id: string;
  title: string;
  description: string;
  svgPath: string;
}

/** 用語集の表示モード */
export type GlossaryViewMode = 'list' | 'map';
