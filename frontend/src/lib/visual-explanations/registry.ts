import type { ComponentType } from 'react';
import { ErrorCurveGraph } from '@/components/visual-explanations/ErrorCurveGraph';
import { BiasVarianceExplanation } from '@/components/visual-explanations/BiasVarianceExplanation';
import { ValidationComparison } from '@/components/visual-explanations/ValidationComparison';
import { ConfusionMatrix } from '@/components/visual-explanations/ConfusionMatrix';
import { RocPrExplanation } from '@/components/visual-explanations/RocPrExplanation';
import { MicroMacroExplanation } from '@/components/visual-explanations/MicroMacroExplanation';
import { MetricRelationshipMap } from '@/components/visual-explanations/MetricRelationshipMap';
import { RegressionMetrics } from '@/components/visual-explanations/RegressionMetrics';
import { LossActivationGuide } from '@/components/visual-explanations/LossActivationGuide';
import { ActivationFunctionExplorer } from '@/components/visual-explanations/ActivationFunctionExplorer';

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
        '混同行列の2x2マトリクスと6つの評価指標を色付き分数で確認。指標クリックでマトリクスが連動ハイライトします。',
      component: ConfusionMatrix,
    },
    {
      id: 'roc-pr-curves',
      title: 'ROC曲線・PR曲線とAUC/AP',
      description:
        'ROC曲線とPR曲線を操作して、AUC・APの意味と不均衡データでの違いを体感できます。',
      component: RocPrExplanation,
    },
    {
      id: 'micro-macro-average',
      title: 'マイクロ平均・マクロ平均',
      description:
        '3クラス混同行列を編集し、マクロ/マイクロ平均の計算過程と使い分けを理解できます。',
      component: MicroMacroExplanation,
    },
    {
      id: 'metric-relationship-map',
      title: '評価指標の関係マップ',
      description:
        '混同行列からROC/PR曲線まで、評価指標の関係をインタラクティブに俯瞰できます。',
      component: MetricRelationshipMap,
    },
    {
      id: 'regression-metrics',
      title: '回帰指標（MAE/MSE/RMSE/R²）',
      description:
        '数式クイズ・残差ビジュアライゼーション・使い分けガイドで、4つの回帰指標を直感的に理解できます。',
      component: RegressionMetrics,
    },
  ],
  'dl-loss': [
    {
      id: 'loss-activation-guide',
      title: '損失関数×活性化関数の組み合わせガイド',
      description:
        '2値分類・多クラス分類・マルチラベル分類・順序回帰の正しい組み合わせと、よくある誤解を整理します。',
      component: LossActivationGuide,
    },
  ],
  'dl-activation': [
    {
      id: 'activation-function-explorer',
      title: '活性化関数エクスプローラー',
      description:
        'sigmoid・tanh・ReLUの曲線と導関数を切替表示し、勾配消失の仕組みを接線・ゾーン色分けで体感できます。',
      component: ActivationFunctionExplorer,
    },
  ],
};

/** 指定サブセクションのビジュアル解説を取得（未登録なら空配列） */
export function getVisualizations(subsectionId: string): VisualizationMeta[] {
  return REGISTRY[subsectionId] ?? [];
}
