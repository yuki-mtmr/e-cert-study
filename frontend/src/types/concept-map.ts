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

/** 用語間の関係種別 */
export type RelationType = 'prerequisite' | 'variant' | 'component' | 'applies';

/** 用語間の1つの関係 */
export interface TermRelation {
  from: string;
  to: string;
  type: RelationType;
  label?: string;
}

/** サブセクション単位の関係データ */
export interface SubsectionRelations {
  subsectionId: string;
  relations: TermRelation[];
}

/** レイアウト計算後のノード */
export interface LayoutNode {
  termId: string;
  x: number;
  y: number;
  level: number;
}

/** レイアウト計算後のエッジ */
export interface LayoutEdge {
  from: string;
  to: string;
  type: RelationType;
  label?: string;
  points: { x: number; y: number }[];
}

/** レイアウト計算結果 */
export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}
