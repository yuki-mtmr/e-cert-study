import type { GlossaryTerm } from '@/types/glossary';

export const MATH_TERMS: GlossaryTerm[] = [
  // 確率・統計
  { id: 'conditional-prob', jaName: '条件付き確率', enName: 'Conditional Probability', description: 'ある事象が起きた条件の下で別の事象が起きる確率。ベイズの定理の基礎となる概念。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'bayes-theorem', jaName: 'ベイズの定理', enName: "Bayes' Theorem", description: '観測データから事後確率を計算する定理。事前確率と尤度から事後確率を導出する。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'prior-prob', jaName: '事前確率', enName: 'Prior Probability', description: 'データを観測する前のパラメータに関する確率分布。ベイズ推定で事前知識を表現する。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'posterior-prob', jaName: '事後確率', enName: 'Posterior Probability', description: 'データを観測した後に更新されたパラメータの確率分布。ベイズの定理で計算される。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'likelihood', jaName: '尤度', enName: 'Likelihood', description: 'パラメータが与えられた下でデータが観測される確率。最尤推定やベイズ推定で中心的な役割を果たす。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'mle', jaName: '最尤推定', enName: 'Maximum Likelihood Estimation', description: '尤度を最大化するパラメータを求める推定法。多くの機械学習モデルの基礎となる。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'map-estimation', jaName: 'MAP推定', enName: 'Maximum A Posteriori Estimation', description: '事後確率を最大化するパラメータを求める推定法。事前分布による正則化効果がある。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'expectation', jaName: '期待値', enName: 'Expected Value', description: '確率変数の平均的な値。確率分布の中心的傾向を表す基本的な統計量。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'variance', jaName: '分散', enName: 'Variance', description: 'データの散らばり具合を表す統計量。期待値からの偏差の二乗の期待値として定義される。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'gaussian', jaName: 'ガウス分布（正規分布）', enName: 'Gaussian Distribution', description: '平均と分散で特徴づけられる連続確率分布。中心極限定理により自然界で広く現れる。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'bernoulli', jaName: 'ベルヌーイ分布', enName: 'Bernoulli Distribution', description: '成功/失敗の二値をとる離散確率分布。二値分類の出力モデリングに使用される。', sectionId: 'math', subsectionId: 'math-prob' },
  { id: 'multinomial', jaName: '多項分布', enName: 'Multinomial Distribution', description: '複数カテゴリへの分類を表す離散確率分布。多クラス分類のソフトマックス出力に対応する。', sectionId: 'math', subsectionId: 'math-prob' },
  // 情報理論
  { id: 'entropy', jaName: 'エントロピー', enName: 'Entropy', description: '確率分布の不確実性を測る指標。情報量の期待値として定義され、値が大きいほど不確実性が高い。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'cross-entropy', jaName: '交差エントロピー', enName: 'Cross Entropy', description: '2つの確率分布間の差異を測る指標。分類タスクの損失関数として広く使用される。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'kl-divergence', jaName: 'KLダイバージェンス', enName: 'KL Divergence', description: '2つの確率分布間の非対称な差異を測る指標。VAEの損失関数や生成モデルの学習に使用される。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'js-divergence', jaName: 'JSダイバージェンス', enName: 'Jensen-Shannon Divergence', description: 'KLダイバージェンスを対称化した指標。GANの学習安定性の議論で重要な役割を持つ。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'mutual-info', jaName: '相互情報量', enName: 'Mutual Information', description: '2つの確率変数間の依存関係を測る指標。特徴選択や表現学習で使用される。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'self-info', jaName: '自己情報量', enName: 'Self-Information', description: '特定の事象が持つ情報量。発生確率が低い事象ほど大きな情報量を持つ。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'info-gain', jaName: '情報利得', enName: 'Information Gain', description: '特徴量による条件分岐でエントロピーがどれだけ減少するかを表す指標。決定木の分岐基準に使用される。', sectionId: 'math', subsectionId: 'math-info' },
  { id: 'perplexity', jaName: 'パープレキシティ', enName: 'Perplexity', description: '言語モデルの性能評価指標。交差エントロピーの指数で、値が小さいほど良い予測を示す。', sectionId: 'math', subsectionId: 'math-info' },
  // 線形代数
  { id: 'eigenvalue', jaName: '固有値', enName: 'Eigenvalue', description: '線形変換でベクトルの方向を変えずにスケーリングする倍率。PCAや行列分解の基礎。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'eigenvector', jaName: '固有ベクトル', enName: 'Eigenvector', description: '線形変換で方向が変わらないベクトル。固有値と対で主成分分析の軸を決定する。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'svd', jaName: '特異値分解', enName: 'Singular Value Decomposition', description: '任意の行列を3つの行列の積に分解する手法。次元削減やデータ圧縮に応用される。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'pca', jaName: '主成分分析', enName: 'Principal Component Analysis', description: 'データの分散が最大となる方向に射影して次元削減する手法。固有値分解に基づく。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'matrix-multiply', jaName: '行列積', enName: 'Matrix Multiplication', description: '2つの行列を掛け合わせる演算。ニューラルネットワークの順伝播計算の基本操作。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'transpose', jaName: '転置行列', enName: 'Transpose', description: '行列の行と列を入れ替えた行列。逆伝播計算や正規方程式で頻出する。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'inverse-matrix', jaName: '逆行列', enName: 'Inverse Matrix', description: '元の行列と掛けると単位行列になる行列。正規方程式の解法などに使用される。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'determinant', jaName: '行列式', enName: 'Determinant', description: '正方行列に対して定義されるスカラー値。行列の正則性判定や体積変化の計算に使用。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'norm', jaName: 'ノルム', enName: 'Norm', description: 'ベクトルや行列の大きさを測る関数。L1ノルム、L2ノルムは正則化に使用される。', sectionId: 'math', subsectionId: 'math-linalg' },
  { id: 'hadamard', jaName: 'アダマール積', enName: 'Hadamard Product', description: '同じサイズの行列同士の要素ごとの積。LSTMのゲート機構などで使用される。', sectionId: 'math', subsectionId: 'math-linalg' },
];
