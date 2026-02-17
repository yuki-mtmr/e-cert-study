import type { TermExamPoints } from '@/types/glossary';

/**
 * 深層学習の応用（DL応用）セクションの試験ポイント
 * E資格の出題傾向・頻出ポイントをまとめたデータ
 */
export const DL_APP_EXAM_POINTS: TermExamPoints[] = [
  // ========================================
  // 画像認識 (app-image)
  // ========================================
  {
    termId: 'lenet',
    points: ['畳み込み→プーリング→全結合の基本構成、MNIST+sigmoid/tanh、AlexNetとの違い'],
  },
  {
    termId: 'alexnet',
    points: ['ImageNet 2012優勝でDLブーム契機、ReLU/Dropout/GPU並列/LRNの4特徴'],
  },
  {
    termId: 'vggnet',
    points: ['3×3小フィルタ重ね→大受容野(2層で5×5相当)、パラメータの大半は全結合層に集中'],
  },
  {
    termId: 'googlenet',
    points: ['Inceptionモジュール(1×1/3×3/5×5並列)、1×1畳み込みでチャネル数削減がカギ'],
  },
  {
    termId: 'resnet',
    points: ['残差接続y=F(x)+xで勾配消失回避、劣化問題を解決、Bottleneck(1×1→3×3→1×1)'],
    formula: 'y = F(x, {W_i}) + x',
  },
  {
    termId: 'densenet',
    points: ['ResNetが加算→DenseNetは結合(concatenation)、全先行層の出力を入力にする密結合'],
  },
  {
    termId: 'efficientnet',
    points: ['深さ×幅×解像度の複合スケーリング(compound scaling)、ベースモデルはNASで探索'],
    formula: 'depth: d=α^φ, width: w=β^φ, resolution: r=γ^φ (α·β²·γ²≈2)',
  },
  {
    termId: 'mobilenet',
    points: ['Depthwise Separable Conv(Depthwise+Pointwise)、計算量≈1/k²に削減、エッジ向け'],
    formula: '計算量比: 1/D_K² + 1/M （D_K: カーネルサイズ, M: 出力チャネル数）',
  },
  {
    termId: 'transfer-learning',
    points: ['事前学習モデルの特徴抽出器を再利用、少量データでも高精度、ドメイン類似度で戦略が変わる'],
  },
  {
    termId: 'fine-tuning',
    points: ['全層学習(フル)vs一部のみ(部分)、学習率は小さく設定(事前学習の重みを壊さないため)'],
  },
  {
    termId: 'image-classification',
    points: ['Top-1/Top-5精度の違い、softmax+CE、マルチラベルはsigmoid+BCEに注意'],
  },
  {
    termId: 'data-aug-image',
    points: ['反転/クロップ/色変換/Mixup/CutMix、学習時のみ（TTA=テスト時拡張は例外）'],
  },
  {
    termId: 'batch-norm-image',
    points: ['ミニバッチで正規化→γ(スケール)β(シフト)、推論時は移動平均を使用（バッチ統計量でない）'],
    formula: 'y = γ · (x - μ_B) / √(σ²_B + ε) + β',
  },
  {
    termId: 'skip-connection',
    points: ['ResNet残差接続=勾配消失回避、U-Netスキップ接続=空間情報保持（目的が異なる）'],
  },

  // ========================================
  // 物体検出 (app-detect)
  // ========================================
  {
    termId: 'rcnn',
    points: ['Selective Search→CNN特徴抽出→SVM分類の3段階、領域ごとにCNN実行で非常に遅い'],
  },
  {
    termId: 'fast-rcnn',
    points: ['画像全体で1回CNN+RoIプーリング、マルチタスク損失でE2E学習、領域提案がまだボトルネック'],
  },
  {
    termId: 'faster-rcnn',
    points: ['RPN(Region Proposal Network)で領域提案もNN化→完全E2E、2段階検出器の代表'],
  },
  {
    termId: 'yolo',
    points: ['グリッド分割→各セルがBBoxとクラスを同時予測、1段階でリアルタイム、小物体が苦手'],
  },
  {
    termId: 'ssd',
    points: ['複数スケールの特徴マップでデフォルトボックス検出、YOLOよりマルチスケール対応'],
  },
  {
    termId: 'feature-pyramid',
    points: ['ボトムアップ+トップダウン+横接続でマルチスケール特徴統合、各レベルが位置+意味情報を保持'],
  },
  {
    termId: 'anchor-box',
    points: ['異なるアスペクト比/スケールの事前定義ボックス、各アンカーに対しオフセット+クラスを予測'],
  },
  {
    termId: 'nms',
    points: ['スコア最大選択→IoU閾値以上を除去→繰返し、Soft-NMSはスコア抑制(ゼロにしない)'],
  },
  {
    termId: 'iou',
    points: ['|A∩B|/|A∪B|で計算、IoU≥0.5で検出成功(PASCAL VOC)、座標からの計算問題頻出'],
    formula: 'IoU = |A ∩ B| / |A ∪ B| = |A ∩ B| / (|A| + |B| - |A ∩ B|)',
  },
  {
    termId: 'map-metric',
    points: ['各クラスでPR曲線→AP算出→全クラス平均=mAP、PASCAL VOC(IoU=0.5)vssCOCO(0.5:0.05:0.95)'],
    formula: 'mAP = (1/|C|) Σ AP_c （C: クラス集合, AP: Average Precision）',
  },
  {
    termId: 'roi-pooling',
    points: ['任意サイズ→固定サイズ(7×7)変換、量子化誤差あり→RoI Align(双線形補間)で解消'],
  },
  {
    termId: 'two-stage',
    points: ['第1段階(領域提案)+第2段階(分類/回帰)、精度高いが速度遅い(1段階との比較頻出)'],
  },
  {
    termId: 'one-stage',
    points: ['領域提案省略→特徴マップから直接予測、YOLO/SSD、高速だが初期は小物体が苦手'],
  },
  {
    termId: 'detr',
    points: ['Transformer+Object Query+二部マッチング損失、アンカー/NMS不要、収束が遅い課題'],
  },

  // ========================================
  // セグメンテーション (app-seg)
  // ========================================
  {
    termId: 'semantic-seg',
    points: ['各ピクセルにクラスラベル（同クラスの個体は区別しない）、評価はmIoU'],
  },
  {
    termId: 'instance-seg',
    points: ['同クラスでも個体を区別、Mask R-CNNが代表、背景(stuff)には非対応'],
  },
  {
    termId: 'panoptic-seg',
    points: ['セマンティック(stuff)+インスタンス(things)を統合、PQ=SQ×RQで評価'],
    formula: 'PQ = SQ × RQ = (Σ IoU(p,g) / |TP|) × (|TP| / (|TP| + |FP|/2 + |FN|/2))',
  },
  {
    termId: 'fcn',
    points: ['全結合層→1×1畳み込みで任意入力サイズ対応、FCN-32s/16s/8s(数字小→高精度)'],
  },
  {
    termId: 'unet',
    points: ['U字型エンコーダ+デコーダ+スキップ接続、医用画像で広く使用、少量データに強い'],
  },
  {
    termId: 'deeplab',
    points: ['Atrous Conv(Dilated Conv)で解像度保持+受容野拡大、ASPPで複数dilation rate並列適用'],
  },
  {
    termId: 'pspnet',
    points: ['ピラミッドプーリング(1×1/2×2/3×3/6×6)でグローバル文脈統合、DeepLabはAtrous Conv'],
  },
  {
    termId: 'mask-rcnn',
    points: ['Faster R-CNN+マスク予測ブランチ、RoI Align(量子化誤差解消)が頻出ポイント'],
  },
  {
    termId: 'atrous-conv',
    points: ['フィルタ間隔(dilation rate)で受容野拡大、パラメータ増なし、rate=1は通常畳み込み'],
    formula: '受容野 = k + (k-1)(r-1) （k: カーネルサイズ, r: dilation rate）',
  },
  {
    termId: 'segformer',
    points: ['Transformerエンコーダ+MLPデコーダ、位置エンコーディング不要、階層的マルチスケール特徴'],
  },

  // ========================================
  // NLP (app-nlp)
  // ========================================
  {
    termId: 'word2vec',
    points: ['CBOW(周辺→中心)vsSkip-gram(中心→周辺)、king-man+woman≈queen、Negative Samplingで高速化'],
  },
  {
    termId: 'glove',
    points: ['共起行列のログを目的関数に組込み(大域的統計)、Word2Vecは局所的文脈(予測型vs計数型)'],
    formula: 'J = Σ f(X_ij)(w_i^T w̃_j + b_i + b̃_j - log X_ij)²',
  },
  {
    termId: 'fasttext',
    points: ['サブワード(文字n-gram)で埋め込み学習→未知語(OOV)にも対応可、形態素豊富な言語で有効'],
  },
  {
    termId: 'word-embedding',
    points: ['One-hot(疎・高次元)→密な低次元ベクトル、文脈非依存(W2V)vs文脈依存(BERT)の違い'],
  },
  {
    termId: 'tokenization',
    points: ['単語/サブワード/文字の3粒度、サブワード(BPE/SentencePiece)が主流で未知語問題を解決'],
  },
  {
    termId: 'bpe',
    points: ['最頻出ペアを統合するボトムアップ手法、マージ回数=語彙サイズ、GPTシリーズで採用'],
  },
  {
    termId: 'sentencepiece',
    points: ['生テキストから直接サブワード学習(事前トークナイゼーション不要)、言語非依存で多言語向き'],
  },
  {
    termId: 'language-model',
    points: ['自己回帰型(次単語予測)vsマスク型(穴埋め)、評価はパープレキシティ(低いほど良い)'],
    formula: 'PPL = exp(-(1/N) Σ log P(w_i | w_1,...,w_{i-1}))',
  },
  {
    termId: 'ner',
    points: ['BIO/IOBタグで系列ラベリング、BiLSTM/BERT+CRF層で系列の整合性を保つ'],
  },
  {
    termId: 'sentiment',
    points: ['文書/文/アスペクトの3粒度、現在はBERTファインチューニングが主流'],
  },
  {
    termId: 'machine-translation',
    points: ['Seq2Seq+Attention→Transformer、評価はBLEU(n-gram一致率)'],
  },
  {
    termId: 'qa',
    points: ['抽出型(スパン特定)vs生成型(回答生成)、BERTで開始/終了位置を予測、SQuADで評価'],
  },
  {
    termId: 'text-classification',
    points: ['BERTの[CLS]トークン出力で分類、多クラス=softmax、マルチラベル=sigmoid'],
  },
  {
    termId: 'pretrained-lm',
    points: ['BERT(MLM+NSP)vsGPT(自己回帰)の事前学習タスクの違い、事前学習→FTのパラダイム'],
  },
  {
    termId: 'prompt-engineering',
    points: ['Zero-shot/Few-shot/CoTの違い、パラメータ更新なしで出力を制御(FTとの最大の違い)'],
  },
  {
    termId: 'instruction-tuning',
    points: ['多様タスクを指示文形式でFT→未見タスクに汎化、RLHF(人間の好み)と2段階で使用'],
  },

  // ========================================
  // 生成モデル (app-gen)
  // ========================================
  {
    termId: 'gan',
    points: ['G(生成)vsD(識別)のミニマックスゲーム、モード崩壊が課題、VAEより鮮明だが不安定'],
    formula: 'min_G max_D V(D,G) = E[log D(x)] + E[log(1 - D(G(z)))]',
  },
  {
    termId: 'vae',
    points: ['損失=再構成誤差+KLダイバージェンス、再パラメータ化トリック(z=μ+σ⊙ε)で微分可能に'],
    formula: 'L = -E_q[log p(x|z)] + KL(q(z|x) || p(z))',
  },
  {
    termId: 'autoencoder',
    points: ['エンコーダ→ボトルネック→デコーダ、線形AE=PCAと等価、Denoising/Sparseの変種'],
  },
  {
    termId: 'dcgan',
    points: ['安定化の設計指針：プーリング→ストライド畳み込み、FC排除、BN使用'],
  },
  {
    termId: 'wgan',
    points: ['Wasserstein距離(EMD)を使用、CriticにLipschitz制約(Weight Clipping/勾配ペナルティ)'],
    formula: 'W(P_r, P_g) = sup_{||f||_L≤1} E[f(x)] - E[f(G(z))]',
  },
  {
    termId: 'stylegan',
    points: ['Mapping Network(z→w)+AdaINでスタイル注入、粗い〜細かい特徴を階層的に制御'],
  },
  {
    termId: 'conditional-gan',
    points: ['G・D両方に条件情報(クラスラベル等)を入力→生成出力を制御可能'],
  },
  {
    termId: 'cycle-gan',
    points: ['ペアデータ不要、サイクル整合性損失G(F(y))≈y/F(G(x))≈xが最重要(Pix2Pixとの違い)'],
    formula: 'L_cyc = E[||F(G(x)) - x||₁] + E[||G(F(y)) - y||₁]',
  },
  {
    termId: 'pix2pix',
    points: ['ペア画像で画像変換(条件付きGAN)、L1+Adversarial損失、PatchGAN識別器'],
    formula: 'L = L_GAN + λ · L_L1  （λはL1損失の重み）',
  },
  {
    termId: 'diffusion-model',
    points: ['前方(ノイズ加算)→逆過程(ノイズ除去)で生成、GANよりモード崩壊なし・安定だが遅い'],
  },
  {
    termId: 'ddpm',
    points: ['T段階でガウスノイズ→逆過程でノイズ予測除去、損失は各ステップのノイズ予測MSE'],
    formula: 'L_simple = E_{t,x_0,ε}[||ε - ε_θ(x_t, t)||²]',
  },
  {
    termId: 'stable-diffusion',
    points: ['潜在空間で拡散(Latent Diffusion)、VAE+U-Net+CLIP(テキスト)の3構成要素'],
  },
  {
    termId: 'flow-based',
    points: ['可逆変換の系列で正確な尤度計算が可能、可逆性制約でモデル設計が限定される'],
    formula: 'log p(x) = log p(z) + Σ log |det(∂f_i/∂z_{i-1})|',
  },
  {
    termId: 'latent-space',
    points: ['データの本質を低次元で表現、VAEは正規分布に正則化→滑らかな補間が可能'],
  },
  {
    termId: 'reparameterization',
    points: ['z=μ+σ⊙ε(ε~N(0,I))で確率的操作を微分可能に、VAEの学習に不可欠'],
    formula: 'z = μ + σ ⊙ ε,  ε ~ N(0, I)',
  },
  {
    termId: 'mode-collapse',
    points: ['Gが多様性を失い少数パターンのみ生成、対策はWGAN/ミニバッチ識別等'],
  },

  // ========================================
  // 深層強化学習 (app-rl)
  // ========================================
  {
    termId: 'mdp',
    points: ['(S,A,P,R,γ)の5つ組、マルコフ性=次状態は現在の状態+行動のみに依存(過去非依存)'],
  },
  {
    termId: 'q-learning',
    points: ['off-policy(行動方策≠学習方策)、SARSAとの違い=maxを使う(SARSAは実際の行動のQ値)'],
    formula: 'Q(s,a) ← Q(s,a) + α[r + γ max_a\' Q(s\',a\') - Q(s,a)]',
  },
  {
    termId: 'dqn',
    points: ['Q値テーブルをNNで近似、Experience Replay+ターゲットネットワークの2安定化技術が最重要'],
  },
  {
    termId: 'policy-gradient',
    points: ['方策を直接パラメータ化→期待報酬の勾配で更新、連続行動空間に自然に対応'],
    formula: '∇_θ J(θ) = E[Σ_t ∇_θ log π_θ(a_t|s_t) · G_t]',
  },
  {
    termId: 'actor-critic',
    points: ['Actor(方策)が行動選択、Critic(価値)が評価、Advantage A(s,a)=Q(s,a)-V(s)で分散低減'],
    formula: 'A(s,a) = Q(s,a) - V(s)  （Advantage関数）',
  },
  {
    termId: 'a3c',
    points: ['複数ワーカーが並列に非同期更新、経験再生不要(並列の多様性で代替)'],
  },
  {
    termId: 'ppo',
    points: ['クリッピングで方策更新幅を制限→学習安定、TRPOの簡易版、RLHFで使用'],
    formula: 'L^CLIP = E[min(r_t(θ)Â_t, clip(r_t(θ), 1-ε, 1+ε)Â_t)]',
  },
  {
    termId: 'reward',
    points: ['即時報酬vs累積報酬(リターン)G_t=Σγ^k r、報酬設計が学習効率に大きく影響'],
    formula: 'G_t = Σ_{k=0}^{∞} γ^k r_{t+k+1}  （γ: 割引率）',
  },
  {
    termId: 'value-function',
    points: ['V(s)=状態の価値、Q(s,a)=状態行動ペアの価値、ベルマン方程式で再帰的定義'],
    formula: 'V^π(s) = E_π[Σ γ^k r_{t+k+1} | s_t=s],  Q^π(s,a) = E_π[Σ γ^k r_{t+k+1} | s_t=s, a_t=a]',
  },
  {
    termId: 'policy',
    points: ['確定的a=μ(s)vs確率的π(a|s)、方策ベースは連続行動空間に適する'],
  },
  {
    termId: 'exploration-exploitation',
    points: ['探索(未知を試す)vs活用(最適行動)のジレンマ、ε-greedy/UCB/ボルツマン探索'],
  },
  {
    termId: 'experience-replay',
    points: ['過去の遷移(s,a,r,s\')をバッファ→ランダムサンプリングで時間的相関を破壊→学習安定化'],
  },
  {
    termId: 'td-learning',
    points: ['TD誤差δ=r+γV(s\')-V(s)でブートストラップ更新、MC法より分散小だがバイアスあり'],
    formula: 'V(s) ← V(s) + α[r + γV(s\') - V(s)]  （δ = r + γV(s\') - V(s): TD誤差）',
  },
  {
    termId: 'rlhf',
    points: ['3段階: (1)SFT (2)報酬モデル学習(人間選好) (3)PPOで方策最適化、DPOとの比較も把握'],
  },

  // ========================================
  // 様々な学習方法 (app-methods)
  // ========================================
  {
    termId: 'meta-learning',
    points: ['学習の仕方を学習、MAML=少数勾配更新で新タスク適応する初期パラメータを学習'],
  },
  {
    termId: 'few-shot',
    points: ['N-way K-shot(Nクラス各Kサンプル)、サポートセット(学習用)vsクエリセット(評価用)'],
  },
  {
    termId: 'zero-shot',
    points: ['未見クラスを属性/テキスト記述で認識、CLIPでゼロショット分類、Few-shotは少数例あり'],
  },
  {
    termId: 'contrastive-learning',
    points: ['正例(同データの異なる拡張)→近く、負例(異データ)→遠く、InfoNCE損失+温度τ'],
    formula: 'L = -log(exp(sim(z_i, z_j)/τ) / Σ_k exp(sim(z_i, z_k)/τ))',
  },
  {
    termId: 'simclr',
    points: ['データ拡張で正例、同バッチ内の他サンプルが負例、大バッチが性能に重要(MoCoとの違い)'],
  },
  {
    termId: 'moco',
    points: ['モメンタムエンコーダ+キュー(負例プール)、小バッチでもOK(SimCLRとの違い)、m≈0.999'],
    formula: 'θ_k ← m · θ_k + (1-m) · θ_q  （m: モメンタム係数, 通常0.999）',
  },
  {
    termId: 'multi-task',
    points: ['複数タスクで共有表現学習、ハード(層共有)vsソフト(正則化で近づける)パラメータ共有'],
  },
  {
    termId: 'curriculum-learning',
    points: ['簡単→難しいサンプルの順に学習、人間の学習過程に着想、Self-paced Learningとの関係'],
  },
  {
    termId: 'active-learning',
    points: ['最も情報価値の高いサンプルを選んでラベル付け依頼→アノテーションコスト削減'],
  },
  {
    termId: 'federated-learning',
    points: ['データを集約せずローカル学習→勾配のみ共有、プライバシー保護、Non-IIDデータが課題'],
  },
  {
    termId: 'graph-nn',
    points: ['グラフ構造(ノード/エッジ)を処理、メッセージパッシング(隣接ノード情報集約)が基本操作'],
  },
  {
    termId: 'gcn',
    points: ['グラフ上の畳み込み(1次チェビシェフ近似)、Over-smoothing問題(深い層で全ノード類似)'],
    formula: 'H^(l+1) = σ(D̃^(-1/2) Ã D̃^(-1/2) H^(l) W^(l))  （Ã = A + I）',
  },
  {
    termId: 'attention-mechanism',
    points: ['Q・K・Vの重み付き和、√d_kスケーリングの理由=内積巨大→softmax飽和防止'],
    formula: 'Attention(Q,K,V) = softmax(QK^T / √d_k) V',
  },
  {
    termId: 'neural-architecture-search',
    points: ['探索空間×探索戦略(RL/進化)×性能評価の3要素、DARTS(微分可能NAS)で効率化'],
  },
  {
    termId: 'continual-learning',
    points: ['破滅的忘却が最大課題、対策3分類: 正則化(EWC)/リプレイ(過去データ)/構造(パラメータ分離)'],
  },
  {
    termId: 'self-training',
    points: ['高確信度予測を擬似ラベルとしてラベルなしデータに付与→再学習(半教師あり)'],
  },

  // ========================================
  // 説明性 (app-xai)
  // ========================================
  {
    termId: 'grad-cam',
    points: ['最終Conv層の勾配→重み付き和→ヒートマップ、CNNの判断根拠可視化で最頻出'],
    formula: 'L^c = ReLU(Σ_k α^c_k A^k),  α^c_k = (1/Z)Σ_i Σ_j ∂y^c/∂A^k_{ij}',
  },
  {
    termId: 'lime',
    points: ['摂動データで局所的に線形モデルで近似、モデル非依存(どんなブラックボックスにも適用可)'],
  },
  {
    termId: 'shap',
    points: ['シャープレイ値で特徴量寄与度、4性質を満たす唯一の手法、KernelSHAP(汎用)vsTreeSHAP(木特化)'],
    formula: 'φ_i = Σ_{S⊆N\\{i}} (|S|!(|N|-|S|-1)!/|N|!) [f(S∪{i}) - f(S)]',
  },
  {
    termId: 'saliency-map',
    points: ['入力ピクセルの勾配(∂y/∂x)を可視化、最もシンプル、Grad-CAMは特徴マップレベル'],
  },
  {
    termId: 'attention-viz',
    points: ['Attention重みをヒートマップ表示、ただし判断根拠を正確に反映するとは限らない'],
  },
  {
    termId: 'feature-importance',
    points: ['Permutation Importance(特徴除外/置換で性能変化)がグローバル指標、SHAPはインスタンスごと'],
  },
  {
    termId: 'counterfactual',
    points: ['「どこを変えれば予測が変わるか」を示す、実現可能性+スパース性が良い説明の基準'],
  },
  {
    termId: 'interpretability',
    points: ['事前解釈性(決定木/線形)vs事後解釈性(LIME/SHAP)、精度と解釈可能性のトレードオフ'],
  },
  {
    termId: 'transparency',
    points: ['透明性=内部構造が観察可能、解釈可能性=人間が理解可能、EU AI Act等で求められる'],
  },
  {
    termId: 'integrated-gradients',
    points: ['ベースライン→入力の直線パスで勾配積分、感度+実装不変性の2公理を満たす'],
    formula: 'IG_i(x) = (x_i - x\'_i) × ∫_0^1 (∂F(x\' + α(x-x\'))/∂x_i) dα',
  },
];
