import type { TermExamPoints } from '@/types/glossary';

/**
 * 機械学習セクションの試験ポイント
 * E資格の出題傾向に基づいた学習ポイントを用語ごとにまとめる
 */
export const ML_EXAM_POINTS: TermExamPoints[] = [
  // ========================================
  // パターン認識 (ml-pattern)
  // ========================================
  {
    termId: 'knn',
    points: ['k小→過学習、k大→未学習、k=1で訓練誤差0、距離ベースなのでスケーリング必須'],
  },
  {
    termId: 'k-means',
    points: ['k-means++で初期化、収束は保証されるが大域最適は保証されない'],
  },
  {
    termId: 'decision-tree',
    points: ['分割基準は情報ゲイン/ジニ不純度（計算問題頻出）、過学習→剪定で対策'],
    formula: '情報ゲイン = H(親) - Σ(|子|/|親|) * H(子)、H = -Σ p_i log₂(p_i)',
  },
  {
    termId: 'random-forest',
    points: ['バギング+特徴量ランダム選択(√d)、OOBスコアで交差検証不要'],
  },
  {
    termId: 'svm',
    points: ['マージン最大化、C大→マージン小(過学習寄り)、サポートベクターのみが境界に影響'],
    formula: 'max α Σαᵢ - 1/2 ΣΣ αᵢαⱼyᵢyⱼK(xᵢ,xⱼ)  s.t. αᵢ≥0, Σαᵢyᵢ=0',
  },
  {
    termId: 'kernel-trick',
    points: ['高次元写像φを計算せずK(x,x\')で内積を求める、RBF: γ大→複雑(過学習)'],
    formula: 'RBFカーネル: K(x,x\') = exp(-γ||x-x\'||²)',
  },
  {
    termId: 'naive-bayes',
    points: ['特徴量間の条件付き独立を仮定（成立しなくても実用上OK）、ゼロ頻度→ラプラススムージング'],
    formula: 'P(C|x) ∝ P(C) Π P(xᵢ|C)',
  },
  {
    termId: 'logistic-regression',
    points: ['出力σ(z)は確率、損失は交差エントロピー（最小二乗ではない）、多クラス→softmax回帰'],
    formula: 'P(y=1|x) = σ(wᵀx + b) = 1 / (1 + exp(-(wᵀx + b)))',
  },
  {
    termId: 'linear-regression',
    points: ['正規方程式w=(XᵀX)⁻¹Xᵀy、L1(Lasso)→スパース、L2(Ridge)→縮小'],
    formula: 'w = (XᵀX)⁻¹Xᵀy、損失: L = 1/n Σ(yᵢ - wᵀxᵢ)²',
  },
  {
    termId: 'gmm',
    points: ['EMアルゴリズム(E-step:負担率、M-step:更新)、k-meansはGMMの特殊ケース'],
    formula: 'p(x) = Σₖ πₖ N(x|μₖ, Σₖ)  (πₖ: 混合係数)',
  },

  // ========================================
  // 機械学習の分類 (ml-class)
  // ========================================
  {
    termId: 'supervised',
    points: ['入力x+正解y→関数f学習、教師なし/半教師あり/自己教師あり/強化学習との対比'],
  },
  {
    termId: 'unsupervised',
    points: ['ラベルなしで構造発見、クラスタリング/次元削減/密度推定が主タスク'],
  },
  {
    termId: 'semi-supervised',
    points: ['少量ラベル+大量ラベルなし、仮定(平滑性/クラスタ/多様体)で未ラベルを活用'],
  },
  {
    termId: 'self-supervised',
    points: ['データ自体から疑似ラベルを設計(BERTのMLM、SimCLRの対比学習)、教師なしとの違い'],
  },
  {
    termId: 'reinforcement',
    points: ['状態s→行動a→報酬r、価値ベース(Q学習)vs方策ベース(PPO)、探索と利用のトレードオフ'],
  },
  {
    termId: 'classification',
    points: ['出力は離散カテゴリ、多クラス手法(OvR/OvO/softmax)、評価は精度/F1/AUC'],
  },
  {
    termId: 'regression-task',
    points: ['出力は連続値、損失はMSE/MAE、評価はR²/RMSE'],
  },
  {
    termId: 'clustering',
    points: ['k-means/階層的/DBSCANの使い分け、DBSCANはクラスタ数不要で任意形状対応'],
  },
  {
    termId: 'dimensionality-reduction',
    points: ['PCA→分散最大化、t-SNE→局所構造保持、次元の呪い対策として必要'],
  },
  {
    termId: 'feature-engineering',
    points: ['選択(フィルタ/ラッパー/埋込み)、エンコーディング(One-hot/Label/Target)の使い分け'],
  },
  {
    termId: 'ensemble',
    points: ['並列+分散削減→バギング、逐次+バイアス削減→ブースティング'],
  },
  {
    termId: 'boosting',
    points: ['AdaBoost→GradientBoosting→XGBoost→LightGBMの進化、残差に新しい木をフィット'],
    formula: 'AdaBoost重み更新: αₜ = 1/2 ln((1-εₜ)/εₜ)',
  },

  // ========================================
  // 機械学習の課題 (ml-issues)
  // ========================================
  {
    termId: 'overfitting',
    points: ['訓練誤差小+テスト誤差大、対策は正則化/Dropout/早期終了/データ拡張'],
  },
  {
    termId: 'underfitting',
    points: ['訓練誤差もテスト誤差も大、モデルが単純すぎるか学習不足'],
  },
  {
    termId: 'bias-variance',
    points: ['汎化誤差=バイアス²+バリアンス+ノイズ、バギング→分散削減、ブースティング→バイアス削減'],
    formula: 'E[(y - f̂(x))²] = Bias(f̂)² + Var(f̂) + σ²',
  },
  {
    termId: 'curse-of-dim',
    points: ['次元増→データ疎→距離ベース手法が劣化、必要サンプル数は指数的増加'],
  },
  {
    termId: 'class-imbalance',
    points: ['SMOTE/アンダーサンプリング/コスト重み付け、不均衡時にaccuracyは不適切'],
  },
  {
    termId: 'data-augmentation',
    points: ['画像(回転/反転/Mixup/CutMix)、学習時のみ適用（テスト時は不適用）'],
  },
  {
    termId: 'missing-data',
    points: ['MCAR/MAR/MNARの欠損パターンで対処法が異なる、無視するとバイアス発生'],
  },
  {
    termId: 'outlier',
    points: ['検出(IQR/Zスコア/Isolation Forest)、MSEは外れ値に敏感・MAEは頑健'],
  },
  {
    termId: 'feature-scaling',
    points: ['標準化(平均0分散1) vs MinMax(0~1)、距離ベース手法で必須・決定木系は不要'],
    formula: '標準化: z = (x - μ) / σ、MinMax: x\' = (x - min) / (max - min)',
  },
  {
    termId: 'label-noise',
    points: ['ラベルノイズ→モデルがノイズを学習→汎化低下、クラウドソーシング品質管理が重要'],
  },
  {
    termId: 'covariate-shift',
    points: ['P_train(x)≠P_test(x)だがP(y|x)は同じ、重要度重み付き学習で対処'],
  },
  {
    termId: 'domain-adaptation',
    points: ['ソース(ラベルあり)→ターゲット(ラベルなし)への知識転移、転移学習の一形態'],
  },

  // ========================================
  // 検証集合 (ml-validation)
  // ========================================
  {
    termId: 'train-test-split',
    points: ['時系列はランダム分割NG→時間順に分割、前処理は分割後に（データリーク防止）'],
  },
  {
    termId: 'cross-validation',
    points: ['全データを訓練+検証に使え評価の分散が小さい、最終評価は別途テストデータで'],
  },
  {
    termId: 'k-fold',
    points: ['k=5or10が一般的、層化k分割は分類タスクでクラス比率を維持する'],
  },
  {
    termId: 'holdout',
    points: ['最シンプルだが分割のランダム性に依存、大規模データでは交差検証より実用的'],
  },
  {
    termId: 'stratified',
    points: ['クラス比率を各分割で維持、不均衡データで層化しないと偏った分割になる'],
  },
  {
    termId: 'hyperparameter',
    points: ['パラメータ(学習で決定)vsハイパーパラメータ(人が設定)、テストデータで選んではNG'],
  },
  {
    termId: 'grid-search',
    points: ['全組み合わせ網羅的→低次元で確実・高次元で非効率、ランダムサーチと比較'],
  },
  {
    termId: 'random-search',
    points: ['高次元でグリッドより効率的、重要でない軸にも均等配置するグリッドの無駄を回避'],
  },
  {
    termId: 'early-stopping',
    points: ['検証損失がpatience回改善なしで打ち切り、暗黙的な正則化効果あり'],
  },
  {
    termId: 'bayesian-optim',
    points: ['ガウス過程でサロゲートモデル→獲得関数(EI/UCB)で次の評価点、評価コスト高い時に有効'],
  },

  // ========================================
  // 性能指標 (ml-metrics)
  // ========================================
  {
    termId: 'accuracy',
    points: ['不均衡データでは多数派予測だけで高くなる→F1やAUCが適切'],
    formula: 'Accuracy = (TP + TN) / (TP + TN + FP + FN)',
  },
  {
    termId: 'precision',
    points: ['FPを減らしたい時に重視（スパム誤検出防止等）、閾値上げ→適合率↑再現率↓'],
    formula: 'Precision = TP / (TP + FP)',
  },
  {
    termId: 'recall',
    points: ['FNを減らしたい時に重視（病気見落とし防止等）、感度=TPR=再現率は同義'],
    formula: 'Recall = TP / (TP + FN)',
  },
  {
    termId: 'f1-score',
    points: ['適合率と再現率の調和平均、一方が極端に低いと値が下がる性質'],
    formula: 'F1 = 2 * Precision * Recall / (Precision + Recall)',
  },
  {
    termId: 'confusion-matrix',
    points: ['TP/FP/FN/TNの4要素の位置を覚え、全指標を導出できるようにする'],
  },
  {
    termId: 'roc-curve',
    points: ['横軸FPR・縦軸TPR、ランダム=対角線(AUC=0.5)、不均衡データはPR曲線が有用'],
    formula: 'TPR = TP/(TP+FN)、FPR = FP/(FP+TN)',
  },
  {
    termId: 'auc',
    points: ['AUC=1.0で完全分類、閾値非依存の総合指標、FP絶対数が重要ならPR-AUC'],
  },
  {
    termId: 'log-loss',
    points: ['確率出力の質を評価、正解に低確率→-logで損失爆発、交差エントロピーと本質同じ'],
    formula: 'LogLoss = -1/n Σ [yᵢ log(pᵢ) + (1-yᵢ) log(1-pᵢ)]',
  },
  {
    termId: 'mse',
    points: ['外れ値に敏感（二乗で強調）、微分可能で最適化しやすい、RMSE=√MSEで元の単位'],
    formula: 'MSE = 1/n Σ(yᵢ - ŷᵢ)²',
  },
  {
    termId: 'mae',
    points: ['外れ値に頑健（絶対値）、0で微分不可→サブ勾配、外れ値多いデータ向き'],
    formula: 'MAE = 1/n Σ|yᵢ - ŷᵢ|',
  },
  {
    termId: 'r-squared',
    points: ['R²=1で完全予測、0で平均値同等、負もあり得る、説明変数追加で必ず増加'],
    formula: 'R² = 1 - Σ(yᵢ - ŷᵢ)² / Σ(yᵢ - ȳ)²',
  },
];
