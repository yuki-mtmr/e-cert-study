import type { ComponentType } from 'react';
import { ErrorCurveGraph } from '@/components/visual-explanations/ErrorCurveGraph';
import { BiasVarianceExplanation } from '@/components/visual-explanations/BiasVarianceExplanation';

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
    {
      id: 'bias-variance',
      title: 'バイアス-バリアンス-ノイズ分解',
      description:
        '射撃アナロジーと数式分解で、バイアス・バリアンス・ノイズの3要素を直感的に理解できます。',
      component: BiasVarianceExplanation,
    },
  ],
};

/** 指定サブセクションのビジュアル解説を取得（未登録なら空配列） */
export function getVisualizations(subsectionId: string): VisualizationMeta[] {
  return REGISTRY[subsectionId] ?? [];
}
