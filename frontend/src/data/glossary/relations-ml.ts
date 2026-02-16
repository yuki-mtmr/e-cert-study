import type { SubsectionRelations } from '@/types/concept-map';

/**
 * 機械学習系5サブセクションの用語間リレーション定義
 *
 * ml-pattern:    パターン認識
 * ml-class:      機械学習の分類
 * ml-issues:     機械学習の課題
 * ml-validation: 検証集合
 * ml-metrics:    性能指標
 */
export const ML_RELATIONS: SubsectionRelations[] = [
  /* ──────────────────────────────────────────────
   * パターン認識 (ml-pattern)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'ml-pattern',
    relations: [
      // 決定木 → ランダムフォレスト（アンサンブル化）
      { from: 'decision-tree', to: 'random-forest', type: 'prerequisite' },

      // SVM → カーネルトリック（非線形拡張）
      { from: 'svm', to: 'kernel-trick', type: 'prerequisite' },

      // 線形回帰 → ロジスティック回帰（連続値から確率への拡張）
      {
        from: 'linear-regression',
        to: 'logistic-regression',
        type: 'variant',
        label: '連続値予測から確率予測への拡張',
      },

      // k-means と GMM（クラスタリング手法の比較）
      {
        from: 'k-means',
        to: 'gmm',
        type: 'variant',
        label: 'ハード割当からソフト割当への拡張',
      },

      // kNN と k-means（距離ベースの分類 vs クラスタリング）
      {
        from: 'knn',
        to: 'k-means',
        type: 'variant',
        label: '教師ありと教師なしの距離ベース手法',
      },

      // ナイーブベイズとロジスティック回帰（生成モデル vs 識別モデル）
      {
        from: 'naive-bayes',
        to: 'logistic-regression',
        type: 'variant',
        label: '生成モデル vs 識別モデル',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 機械学習の分類 (ml-class)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'ml-class',
    relations: [
      // 教師あり学習のタスク
      { from: 'supervised', to: 'classification', type: 'applies' },
      { from: 'supervised', to: 'regression-task', type: 'applies' },

      // 教師なし学習のタスク
      { from: 'unsupervised', to: 'clustering', type: 'applies' },
      { from: 'unsupervised', to: 'dimensionality-reduction', type: 'applies' },

      // アンサンブル → ブースティング
      {
        from: 'ensemble',
        to: 'boosting',
        type: 'variant',
        label: '逐次的なアンサンブル手法',
      },

      // 半教師あり学習は教師ありと教師なしの中間
      {
        from: 'supervised',
        to: 'semi-supervised',
        type: 'variant',
        label: 'ラベルなしデータも活用',
      },

      // 自己教師あり学習は教師なしの発展系
      {
        from: 'unsupervised',
        to: 'self-supervised',
        type: 'variant',
        label: '疑似ラベルを自動生成',
      },

      // 特徴量エンジニアリングは教師あり学習の前処理
      { from: 'feature-engineering', to: 'supervised', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 機械学習の課題 (ml-issues)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'ml-issues',
    relations: [
      // 過学習と未学習（対の概念）
      {
        from: 'overfitting',
        to: 'underfitting',
        type: 'variant',
        label: 'モデル複雑度の両極端',
      },

      // バイアス-バリアンスから過学習・未学習への理論的基盤
      { from: 'bias-variance', to: 'overfitting', type: 'prerequisite' },
      { from: 'bias-variance', to: 'underfitting', type: 'prerequisite' },

      // クラス不均衡 → データ拡張で対処
      { from: 'class-imbalance', to: 'data-augmentation', type: 'applies' },

      // 共変量シフト → ドメイン適応で対処
      { from: 'covariate-shift', to: 'domain-adaptation', type: 'applies' },

      // 外れ値と特徴量スケーリング
      { from: 'outlier', to: 'feature-scaling', type: 'applies' },

      // 次元の呪いと特徴量スケーリング
      { from: 'curse-of-dim', to: 'feature-scaling', type: 'applies' },

      // ラベルノイズは過学習を助長する
      { from: 'label-noise', to: 'overfitting', type: 'applies' },

      // 欠損値と外れ値（データ品質の課題）
      {
        from: 'missing-data',
        to: 'outlier',
        type: 'variant',
        label: 'データ品質に関する異なる課題',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 検証集合 (ml-validation)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'ml-validation',
    relations: [
      // ホールドアウト法は訓練・テスト分割の基本形
      {
        from: 'holdout',
        to: 'train-test-split',
        type: 'variant',
        label: '最もシンプルな分割法',
      },

      // 交差検証 → k分割交差検証（具体的な手法）
      {
        from: 'cross-validation',
        to: 'k-fold',
        type: 'variant',
        label: '代表的な交差検証手法',
      },

      // 層化抽出は交差検証・分割に適用
      { from: 'stratified', to: 'k-fold', type: 'applies' },
      { from: 'stratified', to: 'train-test-split', type: 'applies' },

      // ハイパーパラメータ探索手法
      { from: 'hyperparameter', to: 'grid-search', type: 'applies' },
      { from: 'hyperparameter', to: 'random-search', type: 'applies' },
      { from: 'hyperparameter', to: 'bayesian-optim', type: 'applies' },

      // グリッドサーチ vs ランダムサーチ vs ベイズ最適化
      {
        from: 'grid-search',
        to: 'random-search',
        type: 'variant',
        label: '網羅的探索 vs ランダム探索',
      },
      {
        from: 'random-search',
        to: 'bayesian-optim',
        type: 'variant',
        label: 'ランダム探索から確率的探索へ',
      },

      // 早期終了は検証データで判定
      { from: 'cross-validation', to: 'early-stopping', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 性能指標 (ml-metrics)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'ml-metrics',
    relations: [
      // 混同行列から各指標を算出
      { from: 'confusion-matrix', to: 'accuracy', type: 'prerequisite' },
      { from: 'confusion-matrix', to: 'precision', type: 'prerequisite' },
      { from: 'confusion-matrix', to: 'recall', type: 'prerequisite' },

      // 適合率・再現率 → F1スコア（調和平均）
      { from: 'precision', to: 'f1-score', type: 'component' },
      { from: 'recall', to: 'f1-score', type: 'component' },

      // ROC曲線 → AUC
      { from: 'roc-curve', to: 'auc', type: 'prerequisite' },

      // 回帰指標のバリエーション
      {
        from: 'mse',
        to: 'mae',
        type: 'variant',
        label: '二乗誤差 vs 絶対誤差',
      },
      { from: 'mse', to: 'r-squared', type: 'prerequisite' },

      // 分類指標と回帰指標の対比
      {
        from: 'accuracy',
        to: 'mse',
        type: 'variant',
        label: '分類指標 vs 回帰指標',
      },

      // 対数損失はROC曲線と共に確率的分類の評価に使用
      {
        from: 'log-loss',
        to: 'roc-curve',
        type: 'variant',
        label: '確率評価 vs 閾値評価',
      },
    ],
  },
];
