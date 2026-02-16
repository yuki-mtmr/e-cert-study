import type { SubsectionRelations } from '@/types/concept-map';

/**
 * 深層学習基礎10サブセクションの用語間リレーション定義
 *
 * dl-ffnn:           順伝播型ニューラルネットワーク
 * dl-activation:     活性化関数
 * dl-loss:           損失関数
 * dl-optim:          最適化手法
 * dl-init:           重み初期化
 * dl-reg:            正則化・正規化
 * dl-cnn:            畳み込みニューラルネットワーク
 * dl-rnn:            再帰型ニューラルネットワーク
 * dl-transformer:    Transformer
 * dl-generalization: 汎化理論
 */
export const DL_BASIC_RELATIONS: SubsectionRelations[] = [
  /* ──────────────────────────────────────────────
   * 順伝播型ニューラルネットワーク (dl-ffnn)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-ffnn',
    relations: [
      // ニューロン→パーセプトロン→MLP の前提知識チェーン
      { from: 'neuron', to: 'perceptron', type: 'prerequisite' },
      { from: 'perceptron', to: 'mlp', type: 'prerequisite' },

      // 重み・バイアスはニューロンの構成要素
      { from: 'weight', to: 'neuron', type: 'component' },
      { from: 'bias', to: 'neuron', type: 'component' },

      // 隠れ層はMLPの構成要素
      { from: 'hidden-layer', to: 'mlp', type: 'component' },

      // 順伝播→逆伝播の前提関係
      { from: 'forward-prop', to: 'backprop', type: 'prerequisite' },

      // 逆伝播に必要な概念
      { from: 'chain-rule', to: 'backprop', type: 'prerequisite' },
      { from: 'computational-graph', to: 'backprop', type: 'prerequisite' },
      { from: 'gradient', to: 'backprop', type: 'component' },

      // 万能近似定理の前提
      { from: 'mlp', to: 'universal-approx', type: 'prerequisite' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 活性化関数 (dl-activation)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-activation',
    relations: [
      // Sigmoid → Tanh
      {
        from: 'sigmoid',
        to: 'tanh',
        type: 'variant',
        label: '出力範囲を-1〜1に拡張',
      },

      // ReLU系バリエーションチェーン
      {
        from: 'relu',
        to: 'leaky-relu',
        type: 'variant',
        label: '負領域に小さな勾配',
      },
      {
        from: 'leaky-relu',
        to: 'prelu',
        type: 'variant',
        label: '勾配を学習可能に',
      },
      { from: 'relu', to: 'elu', type: 'variant', label: '負領域を指数関数化' },
      { from: 'relu', to: 'gelu', type: 'variant', label: '確率的ゲート' },
      { from: 'relu', to: 'swish', type: 'variant', label: '自己ゲート機構' },

      // Softplus → Mish
      { from: 'softplus', to: 'mish', type: 'component' },

      // Dying ReLU問題
      { from: 'relu', to: 'dying-relu', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 損失関数 (dl-loss)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-loss',
    relations: [
      // MSE → Huber
      {
        from: 'mse-loss',
        to: 'huber-loss',
        type: 'variant',
        label: '外れ値にロバスト化',
      },

      // 交差エントロピー系
      {
        from: 'cross-entropy-loss',
        to: 'binary-cross-entropy',
        type: 'variant',
        label: '二値分類特化',
      },
      {
        from: 'cross-entropy-loss',
        to: 'focal-loss',
        type: 'variant',
        label: 'クラス不均衡対策',
      },
      {
        from: 'cross-entropy-loss',
        to: 'kl-loss',
        type: 'variant',
        label: '分布間の距離',
      },
      { from: 'cross-entropy-loss', to: 'label-smoothing', type: 'applies' },

      // 距離学習系
      {
        from: 'triplet-loss',
        to: 'contrastive-loss',
        type: 'variant',
        label: '距離学習の派生',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 最適化手法 (dl-optim)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-optim',
    relations: [
      // 学習率はSGDの構成要素
      { from: 'learning-rate', to: 'sgd', type: 'component' },

      // SGD → Momentum → Nesterov バリエーションチェーン
      {
        from: 'sgd',
        to: 'momentum',
        type: 'variant',
        label: '慣性項の追加',
      },
      {
        from: 'momentum',
        to: 'nesterov',
        type: 'variant',
        label: '先読み勾配',
      },

      // Adagrad → RMSProp
      {
        from: 'adagrad',
        to: 'rmsprop',
        type: 'variant',
        label: '勾配蓄積の減衰',
      },

      // Momentum + RMSProp → Adam
      { from: 'momentum', to: 'adam', type: 'component' },
      { from: 'rmsprop', to: 'adam', type: 'component' },

      // Adam → AdamW
      {
        from: 'adam',
        to: 'adamw',
        type: 'variant',
        label: '重み減衰の分離',
      },

      // 学習率スケジュール
      { from: 'learning-rate', to: 'lr-schedule', type: 'applies' },
      { from: 'lr-schedule', to: 'warmup', type: 'component' },

      // 勾配爆発 → 勾配クリッピング
      { from: 'exploding-gradient', to: 'gradient-clipping', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 重み初期化 (dl-init)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-init',
    relations: [
      // ランダム初期化からの各派生
      {
        from: 'random-init',
        to: 'xavier-init',
        type: 'variant',
        label: 'Sigmoid/Tanh向け',
      },
      {
        from: 'random-init',
        to: 'he-init',
        type: 'variant',
        label: 'ReLU向け',
      },
      {
        from: 'random-init',
        to: 'lecun-init',
        type: 'variant',
        label: 'SELU向け',
      },
      {
        from: 'random-init',
        to: 'orthogonal-init',
        type: 'variant',
        label: 'RNN向け直交行列',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 正則化・正規化 (dl-reg)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-reg',
    relations: [
      // L1 → L2
      {
        from: 'l1-reg',
        to: 'l2-reg',
        type: 'variant',
        label: 'スパース性 vs 滑らかさ',
      },

      // L2 → Weight Decay
      {
        from: 'l2-reg',
        to: 'weight-decay',
        type: 'variant',
        label: '更新式での分離',
      },

      // Batch Norm系バリエーション
      {
        from: 'batch-norm',
        to: 'layer-norm',
        type: 'variant',
        label: '層方向に正規化',
      },
      {
        from: 'batch-norm',
        to: 'group-norm',
        type: 'variant',
        label: 'チャネルをグループ化',
      },
      {
        from: 'batch-norm',
        to: 'instance-norm',
        type: 'variant',
        label: '各チャネル独立',
      },

      // データ拡張系
      {
        from: 'mixup',
        to: 'cutmix',
        type: 'variant',
        label: '領域単位で混合',
      },
      { from: 'cutout', to: 'cutmix', type: 'component' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 畳み込みニューラルネットワーク (dl-cnn)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-cnn',
    relations: [
      // 畳み込みの構成要素
      { from: 'filter-kernel', to: 'convolution', type: 'component' },
      { from: 'stride', to: 'convolution', type: 'component' },
      { from: 'padding', to: 'convolution', type: 'component' },

      // 畳み込み → 特徴マップ
      { from: 'convolution', to: 'feature-map', type: 'prerequisite' },

      // 特徴マップ → 受容野
      { from: 'feature-map', to: 'receptive-field', type: 'prerequisite' },

      // プーリングのバリエーション
      { from: 'pooling', to: 'max-pooling', type: 'variant' },
      { from: 'pooling', to: 'avg-pooling', type: 'variant' },
      {
        from: 'avg-pooling',
        to: 'global-avg-pooling',
        type: 'variant',
        label: '空間全体を平均',
      },

      // 畳み込みのバリエーション
      {
        from: 'convolution',
        to: 'depthwise-conv',
        type: 'variant',
        label: 'チャネル毎に独立',
      },
      {
        from: 'convolution',
        to: 'pointwise-conv',
        type: 'variant',
        label: '1x1畳み込み',
      },
      {
        from: 'convolution',
        to: 'dilated-conv',
        type: 'variant',
        label: '受容野の拡大',
      },
      {
        from: 'convolution',
        to: 'deconv',
        type: 'variant',
        label: '逆畳み込み',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 再帰型ニューラルネットワーク (dl-rnn)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-rnn',
    relations: [
      // RNNのバリエーション
      {
        from: 'rnn',
        to: 'lstm',
        type: 'variant',
        label: 'ゲート機構の導入',
      },
      { from: 'rnn', to: 'gru', type: 'variant', label: '簡略化ゲート' },
      {
        from: 'lstm',
        to: 'gru',
        type: 'variant',
        label: 'ゲートを2つに簡略化',
      },
      {
        from: 'rnn',
        to: 'bidirectional-rnn',
        type: 'variant',
        label: '双方向化',
      },

      // RNNの構成要素・適用
      { from: 'hidden-state', to: 'rnn', type: 'component' },
      { from: 'rnn', to: 'bptt', type: 'applies' },

      // LSTMの構成要素
      { from: 'forget-gate', to: 'lstm', type: 'component' },
      { from: 'cell-state', to: 'lstm', type: 'component' },

      // Seq2Seq系
      { from: 'encoder-decoder', to: 'seq2seq', type: 'component' },
      { from: 'encoder-decoder', to: 'teacher-forcing', type: 'applies' },
      { from: 'seq2seq', to: 'beam-search', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * Transformer (dl-transformer)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-transformer',
    relations: [
      // Q/K/V → Scaled Dot-Product → Self-Attention
      { from: 'query-key-value', to: 'scaled-dot-product', type: 'component' },
      { from: 'scaled-dot-product', to: 'self-attention', type: 'component' },

      // Positional Encoding は Self-Attention の構成要素
      { from: 'positional-encoding', to: 'self-attention', type: 'component' },

      // Self-Attention のバリエーション
      {
        from: 'self-attention',
        to: 'multi-head-attention',
        type: 'variant',
        label: '複数ヘッドに分割',
      },
      {
        from: 'self-attention',
        to: 'cross-attention',
        type: 'variant',
        label: '異なる系列間',
      },
      {
        from: 'self-attention',
        to: 'masked-attention',
        type: 'variant',
        label: '未来トークンをマスク',
      },

      // Multi-Head Attention → Flash Attention
      {
        from: 'multi-head-attention',
        to: 'flash-attention',
        type: 'variant',
        label: 'メモリ効率化',
      },

      // Residual Connection は Feed-Forward に適用
      { from: 'residual-connection', to: 'feed-forward', type: 'applies' },

      // Multi-Head Attention → 代表的モデル
      { from: 'multi-head-attention', to: 'bert', type: 'component' },
      { from: 'multi-head-attention', to: 'gpt', type: 'component' },
      { from: 'multi-head-attention', to: 'vision-transformer', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 汎化理論 (dl-generalization)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'dl-generalization',
    relations: [
      // 汎化 → 正則化理論
      { from: 'generalization', to: 'regularization-theory', type: 'prerequisite' },

      // 汎化 → 二重降下現象
      { from: 'generalization', to: 'double-descent', type: 'applies' },

      // 平坦な最小値 → SAM
      { from: 'flat-minima', to: 'sharpness-aware', type: 'prerequisite' },

      // Lottery Ticket → 知識蒸留
      { from: 'lottery-ticket', to: 'knowledge-distillation-gen', type: 'applies' },
    ],
  },
];
