import type { ComponentType } from 'react';
import { ErrorCurveGraph } from '@/components/visual-explanations/ErrorCurveGraph';
import { BiasVarianceExplanation } from '@/components/visual-explanations/BiasVarianceExplanation';
import { ValidationComparison } from '@/components/visual-explanations/ValidationComparison';
import { ConfusionMatrix } from '@/components/visual-explanations/ConfusionMatrix';

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
  'ml-validation': [
    {
      id: 'validation-comparison',
      title: 'ホールドアウト vs k-分割交差検証',
      description:
        'ホールドアウト法と k-分割交差検証の違いを一言サマリーと比較表で確認できます。',
      component: ValidationComparison,
    },
  ],
  'ml-metrics': [
    {
      id: 'confusion-matrix',
      title: '混同行列と評価指標',
      description:
        '混同行列の2x2マトリクスと、そこから導出される4つの評価指標（正解率・適合率・再現率・F1スコア）を確認できます。',
      component: ConfusionMatrix,
    },
  ],
};

/** 指定サブセクションのビジュアル解説を取得（未登録なら空配列） */
export function getVisualizations(subsectionId: string): VisualizationMeta[] {
  return REGISTRY[subsectionId] ?? [];
}
