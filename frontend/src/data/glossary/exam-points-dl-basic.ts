import type { TermExamPoints } from '@/types/glossary';

/**
 * E資格 深層学習基礎 試験ポイント
 * 各用語に対する出題パターン・頻出公式・間違えやすいポイントを記載
 */
export const DL_BASIC_EXAM_POINTS: TermExamPoints[] = [
  // ============================
  // 順伝播型NN (dl-ffnn)
  // ============================
  {
    termId: 'perceptron',
    points: ['単純パーセプトロンはXOR解けない→多層が必要（線形分離不可能）'],
  },
  {
    termId: 'mlp',
    points: ['パラメータ数=入力次元×出力次元+バイアス、隠れ層1つ以上で非線形分離可能'],
  },
  {
    termId: 'forward-prop',
    points: ['h=f(Wx+b)を層ごとに計算、行列の次元対応を確認する問題が頻出'],
    formula: 'z = Wx + b, a = f(z)',
  },
  {
    termId: 'backprop',
    points: ['計算グラフ上で局所勾配×上流勾配で逆向きに伝播、手計算問題が頻出'],
  },
  {
    termId: 'gradient',
    points: ['勾配=損失が最も急に増加する方向、更新はw←w-η∇L（逆方向に進む）'],
    formula: '∇L = (∂L/∂w₁, ∂L/∂w₂, ..., ∂L/∂wₙ)',
  },
  {
    termId: 'chain-rule',
    points: ['合成関数f(g(x))の微分=f\'(g(x))×g\'(x)、誤差逆伝播の数学的基盤'],
    formula: '∂L/∂x = (∂L/∂y)(∂y/∂x)',
  },
  {
    termId: 'computational-graph',
    points: ['加算→勾配そのまま、乗算→値を入れ替えて掛ける、ReLU→正なら1・負なら0'],
  },
  {
    termId: 'hidden-layer',
    points: ['層数=特徴の抽象度、幅=表現力、層と幅でパラメータ数が変化'],
  },
  {
    termId: 'neuron',
    points: ['計算は「重み付き和→活性化関数」の2ステップ'],
    formula: 'y = f(Σ wᵢxᵢ + b)',
  },
  {
    termId: 'weight',
    points: ['全て同じ値で初期化→対称性の問題で学習が進まない、初期値が学習に大きく影響'],
  },
  {
    termId: 'bias',
    points: ['バイアスなし→超平面が原点を通る制約、バイアスは0初期化OK・重みは0初期化NG'],
  },
  {
    termId: 'universal-approx',
    points: ['隠れ層1つで任意の連続関数を近似可能（存在定理）、学習で到達できるかは別問題'],
  },

  // ============================
  // 活性化関数 (dl-activation)
  // ============================
  {
    termId: 'sigmoid',
    points: ['出力(0,1)、微分=σ(1-σ)で最大0.25、入力大/小→勾配消失、隠れ層ではReLU推奨'],
    formula: 'σ(x) = 1 / (1 + e^(-x))',
  },
  {
    termId: 'tanh',
    points: ['出力(-1,1)で原点対称、微分=1-tanh²(x)、sigmoidより勾配消失が軽減'],
    formula: 'tanh(x) = (e^x - e^(-x)) / (e^x + e^(-x))',
  },
  {
    termId: 'relu',
    points: ['x>0→x、x≤0→0、計算軽量で勾配消失しにくい、Dying ReLU問題あり'],
    formula: 'f(x) = max(0, x)',
  },
  {
    termId: 'leaky-relu',
    points: ['負の領域に小さな傾きα(≈0.01)→Dying ReLU緩和、αが固定(PReLUとの違い)'],
    formula: 'f(x) = max(αx, x), α ≈ 0.01',
  },
  {
    termId: 'prelu',
    points: ['負の傾きαが学習パラメータ→Leaky ReLUとの違い、データに適応した活性化'],
    formula: 'f(x) = max(αx, x), αは学習パラメータ',
  },
  {
    termId: 'elu',
    points: ['x<0でα(e^x-1)、出力平均が0に近づく、負の領域でも微分≠0'],
    formula: 'f(x) = x (x > 0), α(e^x - 1) (x ≤ 0)',
  },
  {
    termId: 'gelu',
    points: ['Transformer/BERTで標準採用、ガウスCDFベース、ReLU似だが滑らか'],
    formula: 'GELU(x) = x · Φ(x), Φはガウス分布のCDF',
  },
  {
    termId: 'swish',
    points: ['x×sigmoid(βx)、β=1でSiLU、ReLUより滑らか・非単調'],
    formula: 'f(x) = x · σ(βx)',
  },
  {
    termId: 'softmax',
    points: ['出力総和=1で確率解釈、max引きで数値安定化、CE損失との合成勾配=y-t'],
    formula: 'softmax(xᵢ) = e^(xᵢ) / Σⱼ e^(xⱼ)',
  },
  {
    termId: 'softplus',
    points: ['ReLUの滑らかな近似、微分=sigmoid関数σ(x)'],
    formula: 'f(x) = log(1 + e^x)',
  },
  {
    termId: 'mish',
    points: ['x×tanh(softplus(x))、滑らか・非単調・自己正則化、YOLOv4等で採用'],
    formula: 'f(x) = x · tanh(ln(1 + e^x))',
  },
  {
    termId: 'dying-relu',
    points: ['大きな負の勾配→ニューロンが恒久的に0出力、対策はLeaky ReLU/PReLU/ELU'],
  },

  // ============================
  // 損失関数 (dl-loss)
  // ============================
  {
    termId: 'mse-loss',
    points: ['回帰の標準損失、外れ値に二乗ペナルティ、微分は(予測-正解)に比例'],
    formula: 'L = (1/n) Σ (yᵢ - ŷᵢ)²',
  },
  {
    termId: 'cross-entropy-loss',
    points: ['多クラス分類の標準損失、softmaxとの合成微分=予測確率-正解ラベル'],
    formula: 'L = -Σ tᵢ log(yᵢ)',
  },
  {
    termId: 'binary-cross-entropy',
    points: ['sigmoid+BCEで二値分類、マルチラベルにも使用可(softmax+CEとの違い)'],
    formula: 'L = -[t log(y) + (1-t) log(1-y)]',
  },
  {
    termId: 'hinge-loss',
    points: ['SVMの損失、マージン1未満でペナルティ、t∈{-1,+1}に注意'],
    formula: 'L = max(0, 1 - t · y)',
  },
  {
    termId: 'huber-loss',
    points: ['|誤差|≤δでMSE、>δでMAE的振る舞い、外れ値にロバスト'],
    formula: 'L = 0.5(y-ŷ)² (|y-ŷ|≤δ), δ|y-ŷ|-0.5δ² (otherwise)',
  },
  {
    termId: 'focal-loss',
    points: ['CE×(1-pₜ)^γ、簡単なサンプルの影響を低減、RetinaNetでクラス不均衡対策'],
    formula: 'FL(pₜ) = -αₜ(1 - pₜ)^γ log(pₜ)',
  },
  {
    termId: 'triplet-loss',
    points: ['anchor-positive < anchor-negative + マージンα、ハードネガティブマイニングが性能に大影響'],
    formula: 'L = max(0, d(a,p) - d(a,n) + α)',
  },
  {
    termId: 'contrastive-loss',
    points: ['類似ペア→距離最小化、非類似ペア→マージン以上の距離確保'],
    formula: 'L = y·d² + (1-y)·max(0, m-d)²',
  },
  {
    termId: 'kl-loss',
    points: ['非対称(D_KL(P||Q)≠D_KL(Q||P))、VAEで再構成誤差+KLの構成'],
    formula: 'D_KL(P||Q) = Σ P(x) log(P(x)/Q(x))',
  },
  {
    termId: 'label-smoothing',
    points: ['正解ラベルを1→(1-ε)、他クラスにε/(K-1)を分配、過度な自信(過学習)を防止'],
  },

  // ============================
  // 最適化 (dl-optim)
  // ============================
  {
    termId: 'sgd',
    points: ['w←w-η∇L、ミニバッチが最一般的、η大→発散・η小→収束遅い'],
    formula: 'w ← w - η∇L(w)',
  },
  {
    termId: 'momentum',
    points: ['速度項vで過去の勾配を蓄積、谷底の振動を抑え一貫方向を加速'],
    formula: 'v ← μv - η∇L, w ← w + v',
  },
  {
    termId: 'nesterov',
    points: ['先読み位置(w+μv)で勾配計算→行き過ぎを検知して減速（モメンタムとの違い）'],
    formula: 'v ← μv - η∇L(w + μv), w ← w + v',
  },
  {
    termId: 'adagrad',
    points: ['勾配二乗和を蓄積→更新多いパラメータの学習率↓、学習が進むと停止する問題あり'],
    formula: 'G ← G + (∇L)², w ← w - η∇L / √(G + ε)',
  },
  {
    termId: 'rmsprop',
    points: ['AdaGrad改良：指数移動平均で古い勾配を忘却(ρ≈0.9)、学習率減衰を緩和'],
    formula: 'E[g²] ← ρE[g²] + (1-ρ)(∇L)², w ← w - η∇L / √(E[g²] + ε)',
  },
  {
    termId: 'adam',
    points: ['モメンタム+RMSProp統合、β₁=0.9/β₂=0.999/ε=1e-8、バイアス補正で初期安定化'],
    formula: 'm ← β₁m + (1-β₁)∇L, v ← β₂v + (1-β₂)(∇L)², w ← w - η·m̂/√(v̂+ε)',
  },
  {
    termId: 'adamw',
    points: ['Adam+重み減衰を分離、Transformerのデファクト、Adamでは適応学習率がWDを打ち消す問題を解決'],
    formula: 'w ← w - η(m̂/√(v̂+ε) + λw)',
  },
  {
    termId: 'learning-rate',
    points: ['最重要ハイパーパラメータ、大→発散・小→収束遅い、バッチサイズ大→学習率も大'],
  },
  {
    termId: 'lr-schedule',
    points: ['Step Decay=一定エポックごとに1/10、Cosine Annealing=コサインで徐々に減衰'],
  },
  {
    termId: 'warmup',
    points: ['学習初期に学習率を0→徐々に上げ→ランダム初期重みでの大更新を防止'],
  },
  {
    termId: 'gradient-clipping',
    points: ['ノルムクリッピング(L2全体制限)vs値クリッピング(各要素制限)、RNNの勾配爆発防止に必須'],
  },
  {
    termId: 'vanishing-gradient',
    points: ['sigmoid/tanhの微分<1→層が深いと指数的減衰、対策はReLU/残差接続/LSTM/BN'],
  },
  {
    termId: 'exploding-gradient',
    points: ['勾配が指数的増大→NaN発生、勾配クリッピングが最も直接的な対策'],
  },
  {
    termId: 'batch-size',
    points: ['大バッチ→勾配安定・汎化↓、小バッチ→ノイズが正則化効果・汎化↑'],
  },

  // ============================
  // 重み初期化 (dl-init)
  // ============================
  {
    termId: 'xavier-init',
    points: ['sigmoid/tanh用、Var=2/(n_in+n_out)、He初期化はReLU用（セットで出題）'],
    formula: 'Var(w) = 2 / (n_in + n_out)',
  },
  {
    termId: 'he-init',
    points: ['ReLU用、Var=2/n_in、ReLUが負を0にするためXavierの2倍の分散が必要'],
    formula: 'Var(w) = 2 / n_in',
  },
  {
    termId: 'lecun-init',
    points: ['SELU+LeCun初期化で自己正規化NN、Var=1/n_in（Xavierのfan-in版）'],
    formula: 'Var(w) = 1 / n_in',
  },
  {
    termId: 'zero-init',
    points: ['全重み0→対称性の問題で学習不可、バイアスは0初期化OK・重みはNG'],
  },
  {
    termId: 'random-init',
    points: ['対称性の破壊が目的、現在はXavier/He等の活性化関数に適した手法が標準'],
  },
  {
    termId: 'orthogonal-init',
    points: ['直交行列は特異値全て1→信号の増幅も減衰もなし、RNNの隠れ状態間で有効'],
  },

  // ============================
  // 正則化 (dl-reg)
  // ============================
  {
    termId: 'l1-reg',
    points: ['λΣ|wᵢ|を加算→重みを0に押しやりスパース化、Lasso/特徴選択効果あり'],
    formula: 'L_total = L + λΣ|wᵢ|',
  },
  {
    termId: 'l2-reg',
    points: ['(λ/2)Σwᵢ²を加算→重みを小さく保つ(0にはしにくい)、Ridge回帰に対応'],
    formula: 'L_total = L + (λ/2)Σwᵢ²',
  },
  {
    termId: 'dropout',
    points: ['学習時に確率pで無効化、テスト時は(1-p)倍（逆Dropoutは学習時1/(1-p)倍）'],
  },
  {
    termId: 'batch-norm',
    points: ['ミニバッチ内で正規化→学習可能なγ(スケール)β(シフト)、テスト時は移動平均を使用'],
    formula: 'y = γ · (x - μ_B) / √(σ²_B + ε) + β',
  },
  {
    termId: 'layer-norm',
    points: ['特徴方向に正規化(バッチ非依存)、Transformerで標準、Pre-LN vs Post-LNの違い'],
  },
  {
    termId: 'group-norm',
    points: ['チャネルをG個に分割して正規化、G=1→LayerNorm、G=C→InstanceNorm'],
  },
  {
    termId: 'instance-norm',
    points: ['各サンプル各チャネルで独立に正規化、スタイル変換(Neural Style Transfer)で標準'],
  },
  {
    termId: 'weight-decay',
    points: ['毎ステップ重みを(1-ηλ)倍に縮小、SGDではL2等価だがAdamでは非等価→AdamWの動機'],
  },
  {
    termId: 'spectral-norm',
    points: ['最大特異値を1に制約→リプシッツ定数制御、GANのDiscriminator安定化(SNGAN)'],
  },
  {
    termId: 'mixup',
    points: ['2サンプルをλで線形補間（入力もラベルも）、λ~Beta(α,α)、決定境界を滑らかに'],
    formula: 'x̃ = λxᵢ + (1-λ)xⱼ, ỹ = λyᵢ + (1-λ)yⱼ',
  },
  {
    termId: 'cutout',
    points: ['画像のランダム矩形を黒マスク、ラベルは変更しない（CutMixとの違い）'],
  },
  {
    termId: 'cutmix',
    points: ['画像の一部を別画像で置換+ラベルも面積比で混合、Cutout+Mixupの利点統合'],
  },

  // ============================
  // CNN (dl-cnn)
  // ============================
  {
    termId: 'convolution',
    points: ['出力=(W-F+2P)/S+1は必須暗記、重み共有でパラメータ大幅削減'],
    formula: '出力サイズ = (W - F + 2P) / S + 1',
  },
  {
    termId: 'filter-kernel',
    points: ['フィルタ数=出力チャネル数、3×3が一般的(VGG)、パラメータ数=フィルタ数×(k²×入力ch+1)'],
  },
  {
    termId: 'stride',
    points: ['ストライド大→出力小・計算量減、ストライド2畳み込みがプーリング代替に使われる'],
  },
  {
    termId: 'padding',
    points: ['Same: P=(F-1)/2で入出力同サイズ、Valid: パディングなしで出力が縮小'],
  },
  {
    termId: 'pooling',
    points: ['学習パラメータなし（畳み込みとの違い）、位置ずれへの不変性を獲得'],
  },
  {
    termId: 'max-pooling',
    points: ['領域内最大値を保持(顕著な特徴)、逆伝播は最大値位置のみに勾配が流れる'],
  },
  {
    termId: 'avg-pooling',
    points: ['領域内平均値、逆伝播は全要素に均等分配、情報損失少だが特徴を薄める'],
  },
  {
    termId: 'global-avg-pooling',
    points: ['特徴マップ全体→1値に要約、全結合層の代替でパラメータ大幅削減(NiN/GoogLeNet)'],
  },
  {
    termId: 'feature-map',
    points: ['浅い層→低レベル(エッジ/色)、深い層→高レベル(物体部品)、チャネル増+空間減が典型'],
  },
  {
    termId: 'receptive-field',
    points: ['3×3を2層→5×5相当の受容野、小フィルタ重ねが大フィルタより少パラメータ'],
  },
  {
    termId: 'depthwise-conv',
    points: ['各チャネルに独立フィルタ、Pointwise(1×1)と組合せてDepthwise Separable Conv(MobileNet)'],
  },
  {
    termId: 'pointwise-conv',
    points: ['1×1畳み込みでチャネル方向の線形結合、チャネル数の増減に使用(NiN/GoogLeNet)'],
  },
  {
    termId: 'dilated-conv',
    points: ['フィルタ間にギャップ→パラメータ増やさず受容野拡大、WaveNet/DeepLabで使用'],
  },
  {
    termId: 'deconv',
    points: ['転置畳み込み(Transposed Conv)が正式名称、チェッカーボードアーティファクトに注意'],
  },

  // ============================
  // RNN (dl-rnn)
  // ============================
  {
    termId: 'rnn',
    points: ['h_t=f(W_hh·h_{t-1}+W_xh·x_t+b)、同じ重みを全時刻で共有、長系列で勾配消失/爆発'],
    formula: 'h_t = tanh(W_hh · h_{t-1} + W_xh · x_t + b)',
  },
  {
    termId: 'lstm',
    points: ['忘却/入力/出力の3ゲート+セル状態、パラメータ数はRNNの4倍、長期依存が可能'],
    formula: 'f_t = σ(W_f·[h_{t-1}, x_t] + b_f), i_t = σ(W_i·[h_{t-1}, x_t] + b_i), C_t = f_t⊙C_{t-1} + i_t⊙tanh(W_C·[h_{t-1}, x_t] + b_C)',
  },
  {
    termId: 'gru',
    points: ['リセット+更新の2ゲート(LSTMより簡素)、セル状態なし、性能差は小さいがパラメータ少'],
    formula: 'z_t = σ(W_z·[h_{t-1}, x_t]), r_t = σ(W_r·[h_{t-1}, x_t]), h_t = (1-z_t)⊙h_{t-1} + z_t⊙tanh(W·[r_t⊙h_{t-1}, x_t])',
  },
  {
    termId: 'bptt',
    points: ['RNNを時間方向に展開して逆伝播、長系列→Truncated BPTTで区切って学習'],
  },
  {
    termId: 'bidirectional-rnn',
    points: ['順方向+逆方向を結合→各時刻で過去と未来の文脈利用、リアルタイム処理には不向き'],
  },
  {
    termId: 'seq2seq',
    points: ['エンコーダ→固定長ベクトル→デコーダ、入出力の系列長が異なってもOK、ボトルネック→Attention導入'],
  },
  {
    termId: 'encoder-decoder',
    points: ['エンコーダとデコーダを分離、Attention前は最終隠れ状態のみ伝達がボトルネック'],
  },
  {
    termId: 'teacher-forcing',
    points: ['学習時はデコーダ入力に正解を使用→収束速い、推論時は自身の予測→exposure bias'],
  },
  {
    termId: 'beam-search',
    points: ['ビーム幅Bで上位B候補を保持、B=1は貪欲法、長さで正規化しないと短い系列が有利'],
  },
  {
    termId: 'hidden-state',
    points: ['固定サイズベクトルに過去を圧縮→長い系列で初期情報が失われやすい'],
  },
  {
    termId: 'forget-gate',
    points: ['sigmoid(0~1)でセル状態の情報を忘れるか保持するか制御、バイアス1初期化テクニック'],
    formula: 'f_t = σ(W_f · [h_{t-1}, x_t] + b_f)',
  },
  {
    termId: 'cell-state',
    points: ['LSTMの長期記憶、加算的更新で勾配がそのまま流れる→勾配消失しにくい'],
  },

  // ============================
  // Transformer (dl-transformer)
  // ============================
  {
    termId: 'self-attention',
    points: ['全トークン間の関連度を計算、計算量O(n²)、CNN/RNNと違い直接的な長距離依存'],
  },
  {
    termId: 'multi-head-attention',
    points: ['Q,K,Vをh個に分割→独立に注意計算→結合、h=8でd_k=512/8=64'],
    formula: 'MultiHead(Q,K,V) = Concat(head₁,...,headₕ)W^O, headᵢ = Attention(QWᵢ^Q, KWᵢ^K, VWᵢ^V)',
  },
  {
    termId: 'scaled-dot-product',
    points: ['QKᵀ/√d_k→softmax→V、√d_kで割らないと内積巨大→softmax飽和'],
    formula: 'Attention(Q,K,V) = softmax(QK^T / √d_k)V',
  },
  {
    termId: 'positional-encoding',
    points: ['Transformerは構造的に順序情報なし→位置エンコーディングで補う、sin/cos(固定)vs学習可能'],
    formula: 'PE(pos,2i) = sin(pos/10000^(2i/d)), PE(pos,2i+1) = cos(pos/10000^(2i/d))',
  },
  {
    termId: 'feed-forward',
    points: ['Transformer内の2層FC、中間次元=d_modelの4倍、各位置に独立適用'],
    formula: 'FFN(x) = W₂ · ReLU(W₁x + b₁) + b₂',
  },
  {
    termId: 'residual-connection',
    points: ['y=F(x)+xで勾配が直接流れる→100層超の学習を可能に、ResNetで提案'],
    formula: 'output = x + Sublayer(x)',
  },
  {
    termId: 'layer-norm-transformer',
    points: ['Post-LN(元論文)vsPost-LN→Pre-LNの方が学習安定、BNでなくLNを使う理由=バッチ非依存'],
  },
  {
    termId: 'query-key-value',
    points: ['Query=何を探す、Key=何を持つ、Value=実際の情報、検索アナロジーで理解'],
  },
  {
    termId: 'bert',
    points: ['エンコーダのみ+MLM(15%マスク)+NSP、双方向文脈、[CLS]トークンで文分類'],
  },
  {
    termId: 'gpt',
    points: ['デコーダのみ+自己回帰(左→右)、BERTとの違い=一方向、スケーリング則で性能向上'],
  },
  {
    termId: 'vision-transformer',
    points: ['画像をパッチ分割→線形射影でトークン化、大規模事前学習が鍵、少量データではCNNに劣る'],
  },
  {
    termId: 'cross-attention',
    points: ['Qはデコーダ、K/Vはエンコーダから供給（自己注意との違い）、異モダリティ間の情報統合'],
  },
  {
    termId: 'masked-attention',
    points: ['未来位置を-∞でマスク→softmax後に0、デコーダの自己回帰性を保つ（上三角マスク）'],
  },
  {
    termId: 'flash-attention',
    points: ['SRAM/HBM間IO最小化で高速化、数学的にstandard attentionと同一（近似ではない）、メモリO(n)'],
  },

  // ============================
  // 汎化性能 (dl-generalization)
  // ============================
  {
    termId: 'generalization',
    points: ['汎化ギャップ=訓練誤差とテスト誤差の差、小さいほど汎化性能が高い'],
  },
  {
    termId: 'regularization-theory',
    points: ['モデルの複雑さにペナルティ→汎化向上、暗黙的正則化(SGDノイズ/Early Stopping)も含む'],
  },
  {
    termId: 'double-descent',
    points: ['パラメータ数>データ数（補間閾値）付近でテスト誤差ピーク→さらに増やすと再び減少'],
  },
  {
    termId: 'lottery-ticket',
    points: ['密なNNに独立学習で同等性能のスパースなサブネットが存在するという仮説'],
  },
  {
    termId: 'neural-scaling-law',
    points: ['性能∝N^(-α)のべき乗則、Chinchilla則=モデルとデータを均等にスケール'],
  },
  {
    termId: 'flat-minima',
    points: ['平坦な最小値→汎化性能高い、小バッチ→平坦、大バッチ→鋭い最小値に収束しやすい'],
  },
  {
    termId: 'sharpness-aware',
    points: ['損失値+鋭さを同時に最小化(SAM)、2ステップ最適化で計算コスト約2倍'],
    formula: 'min_w max_{||ε||≤ρ} L(w + ε)',
  },
  {
    termId: 'knowledge-distillation-gen',
    points: ['Teacher→Studentにsoft targets(温度T↑で滑らか)で学習、クラス間類似度情報を伝達'],
    formula: 'L = αL_CE(y, p_S) + (1-α)T²·L_KL(p_T/T, p_S/T)',
  },
];
