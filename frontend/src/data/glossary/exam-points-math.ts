import type { TermExamPoints } from '@/types/glossary';

export const MATH_EXAM_POINTS: TermExamPoints[] = [
  // ===== 確率・統計 (math-prob) =====
  {
    termId: 'conditional-prob',
    points: ['分母がP(B)→条件付き確率、分母がP(A∩B)→同時確率との混同に注意'],
    formula: 'P(A|B) = P(A ∩ B) / P(B)',
  },
  {
    termId: 'bayes-theorem',
    points: ['事後∝尤度×事前、分母P(D)は正規化定数でθに依存しない'],
    formula: 'P(θ|D) = P(D|θ)P(θ) / P(D)',
  },
  {
    termId: 'prior-prob',
    points: ['ガウス事前→L2正則化、ラプラス事前→L1正則化、一様事前→MLE一致'],
  },
  {
    termId: 'posterior-prob',
    points: ['事後確率∝尤度×事前確率、MAP=最頻値のみ、ベイズ推定=分布全体'],
  },
  {
    termId: 'likelihood',
    points: ['尤度はθの関数であり確率分布ではない（積分しても1にならない）'],
    formula: 'L(θ) = ∏ P(xᵢ|θ)',
  },
  {
    termId: 'mle',
    points: ['対数尤度を微分→0で求める、正則化なし→過学習しやすい（MAP との違い）'],
  },
  {
    termId: 'map-estimation',
    points: ['MAP=MLE+事前分布（正則化項）、ガウス事前→L2、一様事前→MLE一致'],
    formula: 'θ_MAP = argmax P(θ|D) = argmax P(D|θ)P(θ)',
  },
  {
    termId: 'expectation',
    points: ['E[aX+bY]=aE[X]+bE[Y]は独立性不要、離散Σ/連続∫の使い分け'],
    formula: 'E[X] = Σ xᵢP(xᵢ)  /  E[X] = ∫ xf(x)dx',
  },
  {
    termId: 'variance',
    points: ['V[aX+b]=a²V[X]（定数加算は影響なし）、V[X+Y]=V[X]+V[Y]は独立時のみ'],
    formula: 'V[X] = E[X²] - (E[X])²',
  },
  {
    termId: 'gaussian',
    points: ['再生性（和もガウス）、MLEが最小二乗法と等価、多次元は共分散行列がカギ'],
    formula: 'f(x) = (1/√(2πσ²)) exp(-(x-μ)² / 2σ²)',
  },
  {
    termId: 'bernoulli',
    points: ['二値分類の出力分布、BCE損失=ベルヌーイの負対数尤度と等価'],
    formula: 'P(X=k) = p^k(1-p)^(1-k),  k ∈ {0,1}',
  },
  {
    termId: 'multinomial',
    points: ['多クラス分類のsoftmax出力をモデル化、カテゴリカルCE=負対数尤度'],
  },

  // ===== 情報理論 (math-info) =====
  {
    termId: 'entropy',
    points: ['一様分布で最大、偏るほど小さい、決定木の情報利得で使用'],
    formula: 'H(P) = -Σ P(x) log P(x)',
  },
  {
    termId: 'cross-entropy',
    points: ['H(P,Q)のPがラベル・Qが予測（順序注意）、P固定ならKL最小化と等価'],
    formula: 'H(P, Q) = -Σ P(x) log Q(x)',
  },
  {
    termId: 'kl-divergence',
    points: ['D_KL(P||Q)≥0、非対称（距離ではない）、VAEの正則化項として使用'],
    formula: 'D_KL(P||Q) = Σ P(x) log(P(x) / Q(x))',
  },
  {
    termId: 'js-divergence',
    points: ['KLを対称化した指標、GAN元論文の損失=JSD最小化、有界[0, log2]'],
    formula: 'JSD(P||Q) = (D_KL(P||M) + D_KL(Q||M)) / 2,  M = (P+Q)/2',
  },
  {
    termId: 'mutual-info',
    points: ['I(X;Y)=H(X)-H(X|Y)、独立なら0、特徴選択で大きい特徴を選ぶ'],
    formula: 'I(X;Y) = H(X) - H(X|Y)',
  },
  {
    termId: 'self-info',
    points: ['I(x)=-logP(x)、確率低→情報量大、エントロピーは自己情報量の期待値'],
    formula: 'I(x) = -log P(x)',
  },
  {
    termId: 'info-gain',
    points: ['分割前後のエントロピー減少量、決定木(ID3/C4.5)の分岐基準（数値計算頻出）'],
    formula: 'IG(S, A) = H(S) - Σ (|Sᵥ|/|S|) H(Sᵥ)',
  },
  {
    termId: 'perplexity',
    points: ['PPL=2^H(P,Q)、低いほど良い言語モデル、「次の候補が平均何個か」の解釈'],
    formula: 'PPL = 2^(H(P,Q))  /  PPL = exp(H(P,Q))',
  },

  // ===== 線形代数 (math-linalg) =====
  {
    termId: 'eigenvalue',
    points: ['Av=λv、PCAで固有値=各主成分の分散（寄与率）、和=トレース・積=行列式'],
    formula: 'Av = λv  →  det(A - λI) = 0',
  },
  {
    termId: 'eigenvector',
    points: ['PCAで固有ベクトル=主成分の方向、固有値大い順に第1・第2主成分'],
    formula: '(A - λI)v = 0',
  },
  {
    termId: 'svd',
    points: ['A=UΣVᵀ、任意行列に適用可（固有値分解は正方のみ）、低ランク近似で次元削減'],
    formula: 'A = UΣVᵀ',
  },
  {
    termId: 'pca',
    points: ['共分散行列の固有値分解→寄与率=各固有値/総和、事前に標準化が必須'],
  },
  {
    termId: 'matrix-multiply',
    points: ['(m×n)(n×p)→(m×p)で内側一致が必要、AB≠BA（非可換）が引っかけ頻出'],
  },
  {
    termId: 'transpose',
    points: ['(AB)ᵀ=BᵀAᵀ（順序反転）、逆伝播で重み行列の転置が登場'],
    formula: '(AB)ᵀ = BᵀAᵀ',
  },
  {
    termId: 'inverse-matrix',
    points: ['det(A)≠0で存在、正規方程式θ=(XᵀX)⁻¹Xᵀyで使用、正則でなければ正則化'],
    formula: 'A⁻¹ = (1/det(A)) adj(A)  /  2×2: [a b; c d]⁻¹ = (1/(ad-bc))[d -b; -c a]',
  },
  {
    termId: 'determinant',
    points: ['det=0→特異（逆行列なし）、2×2はad-bc、固有値の積=行列式'],
    formula: 'det([a b; c d]) = ad - bc',
  },
  {
    termId: 'norm',
    points: ['スパース化→L1(Lasso)、縮小→L2(Ridge)、正則化との対応を覚える'],
    formula: '||x||₁ = Σ|xᵢ|,  ||x||₂ = √(Σxᵢ²)',
  },
  {
    termId: 'hadamard',
    points: ['要素ごとの積(⊙)、LSTMのゲート機構で使用、NumPyでは*が⊙・@が行列積'],
    formula: '(A ⊙ B)ᵢⱼ = Aᵢⱼ × Bᵢⱼ',
  },
];
