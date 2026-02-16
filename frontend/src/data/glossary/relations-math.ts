import type { SubsectionRelations } from '@/types/concept-map';

/**
 * 数学系3サブセクションの用語間リレーション定義
 *
 * math-prob:  確率・統計
 * math-info:  情報理論
 * math-linalg: 線形代数
 */
export const MATH_RELATIONS: SubsectionRelations[] = [
  /* ──────────────────────────────────────────────
   * 確率・統計 (math-prob)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'math-prob',
    relations: [
      // ベイズ推定の前提知識チェーン
      { from: 'conditional-prob', to: 'bayes-theorem', type: 'prerequisite' },
      { from: 'prior-prob', to: 'bayes-theorem', type: 'component' },
      { from: 'likelihood', to: 'bayes-theorem', type: 'component' },
      { from: 'bayes-theorem', to: 'posterior-prob', type: 'prerequisite' },

      // 推定手法
      { from: 'likelihood', to: 'mle', type: 'prerequisite' },
      { from: 'posterior-prob', to: 'map-estimation', type: 'prerequisite' },
      {
        from: 'mle',
        to: 'map-estimation',
        type: 'variant',
        label: '事前分布の有無',
      },

      // 統計量
      { from: 'expectation', to: 'variance', type: 'prerequisite' },

      // 分布のバリエーション
      {
        from: 'bernoulli',
        to: 'multinomial',
        type: 'variant',
        label: '二値から多値への拡張',
      },
      {
        from: 'gaussian',
        to: 'bernoulli',
        type: 'variant',
        label: '連続分布と離散分布',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 情報理論 (math-info)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'math-info',
    relations: [
      // エントロピー体系
      { from: 'self-info', to: 'entropy', type: 'prerequisite' },
      { from: 'entropy', to: 'cross-entropy', type: 'prerequisite' },
      { from: 'cross-entropy', to: 'kl-divergence', type: 'prerequisite' },
      {
        from: 'kl-divergence',
        to: 'js-divergence',
        type: 'prerequisite',
        label: 'KLダイバージェンスの対称化',
      },

      // エントロピーの応用
      { from: 'entropy', to: 'mutual-info', type: 'prerequisite' },
      { from: 'entropy', to: 'info-gain', type: 'prerequisite' },
      {
        from: 'cross-entropy',
        to: 'perplexity',
        type: 'prerequisite',
        label: '指数で定義',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 線形代数 (math-linalg)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'math-linalg',
    relations: [
      // 行列演算の基礎チェーン
      { from: 'matrix-multiply', to: 'transpose', type: 'prerequisite' },
      { from: 'transpose', to: 'inverse-matrix', type: 'prerequisite' },
      { from: 'determinant', to: 'inverse-matrix', type: 'prerequisite' },

      // 固有値・固有ベクトル → 分解手法
      { from: 'eigenvalue', to: 'svd', type: 'component' },
      { from: 'eigenvector', to: 'svd', type: 'component' },
      { from: 'eigenvalue', to: 'pca', type: 'prerequisite' },
      { from: 'eigenvector', to: 'pca', type: 'prerequisite' },
      {
        from: 'svd',
        to: 'pca',
        type: 'variant',
        label: 'SVDはPCAの一般化',
      },

      // ノルムの適用先
      { from: 'norm', to: 'eigenvector', type: 'applies' },
      {
        from: 'hadamard',
        to: 'matrix-multiply',
        type: 'variant',
        label: '要素ごと積 vs 行列積',
      },
    ],
  },
];
