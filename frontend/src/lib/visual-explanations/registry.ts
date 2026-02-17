import type { ComponentType } from 'react';
import { ErrorCurveGraph } from '@/components/visual-explanations/ErrorCurveGraph';

export interface VisualizationMeta {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
}

/** サブセクションID → ビジュアル解説の一覧 */
const REGISTRY: Record<string, VisualizationMeta[]> = {
  'ml-issues': [
    {
      id: 'error-curve',
      title: '訓練誤差と汎化誤差の関係',
      description:
        'モデルの複雑さやデータ量を変化させたとき、訓練誤差と汎化誤差がどう変わるかを視覚的に確認できます。',
      component: ErrorCurveGraph,
    },
  ],
};

/** 指定サブセクションのビジュアル解説を取得（未登録なら空配列） */
export function getVisualizations(subsectionId: string): VisualizationMeta[] {
  return REGISTRY[subsectionId] ?? [];
}
