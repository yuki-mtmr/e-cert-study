import type { SubsectionRelations } from '@/types/concept-map';

/**
 * DL応用系8サブセクションの用語間リレーション定義
 *
 * app-image:   画像認識
 * app-detect:  物体検出
 * app-seg:     セグメンテーション
 * app-nlp:     自然言語処理
 * app-gen:     生成モデル
 * app-rl:      深層強化学習
 * app-methods: 様々な学習方法
 * app-xai:     説明性(XAI)
 */
export const DL_APP_RELATIONS: SubsectionRelations[] = [
  /* ──────────────────────────────────────────────
   * 画像認識 (app-image)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-image',
    relations: [
      // CNNアーキテクチャの進化チェーン
      { from: 'lenet', to: 'alexnet', type: 'prerequisite', label: 'CNN進化の起点' },
      { from: 'alexnet', to: 'vggnet', type: 'prerequisite', label: 'より深いCNN' },
      {
        from: 'vggnet',
        to: 'googlenet',
        type: 'variant',
        label: 'Inceptionモジュール導入',
      },
      {
        from: 'vggnet',
        to: 'resnet',
        type: 'variant',
        label: '残差接続の導入',
      },
      {
        from: 'resnet',
        to: 'densenet',
        type: 'variant',
        label: '密結合への拡張',
      },
      {
        from: 'resnet',
        to: 'efficientnet',
        type: 'variant',
        label: '複合スケーリング',
      },
      {
        from: 'mobilenet',
        to: 'efficientnet',
        type: 'variant',
        label: '軽量化の発展',
      },

      // 構成要素
      { from: 'resnet', to: 'skip-connection', type: 'component' },

      // 学習テクニック
      { from: 'transfer-learning', to: 'fine-tuning', type: 'prerequisite' },
      { from: 'image-classification', to: 'data-aug-image', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 物体検出 (app-detect)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-detect',
    relations: [
      // R-CNNファミリーの進化チェーン
      { from: 'rcnn', to: 'fast-rcnn', type: 'prerequisite', label: '特徴共有で高速化' },
      { from: 'fast-rcnn', to: 'faster-rcnn', type: 'prerequisite', label: 'RPNで領域提案もNN化' },

      // 構成要素
      { from: 'faster-rcnn', to: 'roi-pooling', type: 'component' },
      { from: 'faster-rcnn', to: 'feature-pyramid', type: 'applies' },

      // 検出パラダイム
      { from: 'two-stage', to: 'rcnn', type: 'applies' },
      { from: 'one-stage', to: 'yolo', type: 'applies' },
      { from: 'one-stage', to: 'ssd', type: 'applies' },

      // 後処理・評価
      { from: 'anchor-box', to: 'nms', type: 'applies' },
      { from: 'iou', to: 'map-metric', type: 'prerequisite' },

      // Transformerベースへの発展
      {
        from: 'faster-rcnn',
        to: 'detr',
        type: 'variant',
        label: 'Transformerベース検出',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * セグメンテーション (app-seg)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-seg',
    relations: [
      // セグメンテーションタスクの関係
      {
        from: 'semantic-seg',
        to: 'instance-seg',
        type: 'variant',
        label: '個体区別の有無',
      },
      { from: 'semantic-seg', to: 'panoptic-seg', type: 'component' },
      { from: 'instance-seg', to: 'panoptic-seg', type: 'component' },

      // FCNベースのモデル発展
      {
        from: 'fcn',
        to: 'unet',
        type: 'variant',
        label: 'エンコーダ・デコーダ+スキップ接続',
      },
      { from: 'fcn', to: 'deeplab', type: 'variant', label: 'Atrous Convolution導入' },
      { from: 'fcn', to: 'pspnet', type: 'variant', label: 'ピラミッドプーリング導入' },

      // 構成要素
      { from: 'atrous-conv', to: 'deeplab', type: 'component' },

      // インスタンスセグメンテーションモデル
      { from: 'mask-rcnn', to: 'instance-seg', type: 'applies' },

      // Transformerベース
      { from: 'segformer', to: 'semantic-seg', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 自然言語処理 (app-nlp)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-nlp',
    relations: [
      // 単語埋め込み手法
      { from: 'word-embedding', to: 'word2vec', type: 'variant', label: 'NN埋め込み' },
      { from: 'word-embedding', to: 'glove', type: 'variant', label: '共起行列ベース' },
      {
        from: 'word2vec',
        to: 'fasttext',
        type: 'variant',
        label: 'サブワード情報の活用',
      },

      // トークナイゼーション手法
      { from: 'tokenization', to: 'bpe', type: 'variant', label: 'サブワード分割' },
      { from: 'bpe', to: 'sentencepiece', type: 'variant', label: '言語非依存化' },

      // 言語モデルの発展と応用
      { from: 'language-model', to: 'pretrained-lm', type: 'prerequisite' },
      { from: 'pretrained-lm', to: 'prompt-engineering', type: 'applies' },
      { from: 'pretrained-lm', to: 'instruction-tuning', type: 'applies' },
      { from: 'pretrained-lm', to: 'ner', type: 'applies' },
      { from: 'pretrained-lm', to: 'sentiment', type: 'applies' },
      { from: 'language-model', to: 'machine-translation', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 生成モデル (app-gen)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-gen',
    relations: [
      // オートエンコーダ系
      { from: 'autoencoder', to: 'vae', type: 'variant', label: '確率的潜在変数の導入' },
      { from: 'vae', to: 'reparameterization', type: 'component' },
      { from: 'vae', to: 'latent-space', type: 'component' },

      // GANバリエーション
      { from: 'gan', to: 'dcgan', type: 'variant', label: 'CNNの導入' },
      { from: 'gan', to: 'wgan', type: 'variant', label: 'Wasserstein距離' },
      { from: 'gan', to: 'conditional-gan', type: 'variant', label: '条件付き生成' },
      { from: 'gan', to: 'stylegan', type: 'variant', label: 'スタイルベース生成' },
      { from: 'conditional-gan', to: 'pix2pix', type: 'variant', label: 'ペア画像変換' },
      { from: 'conditional-gan', to: 'cycle-gan', type: 'variant', label: 'ペアなし画像変換' },

      // GANの課題
      { from: 'gan', to: 'mode-collapse', type: 'applies' },

      // 拡散モデル系
      { from: 'diffusion-model', to: 'ddpm', type: 'variant', label: '代表的な拡散手法' },
      {
        from: 'ddpm',
        to: 'stable-diffusion',
        type: 'variant',
        label: '潜在空間での拡散',
      },
    ],
  },

  /* ──────────────────────────────────────────────
   * 深層強化学習 (app-rl)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-rl',
    relations: [
      // 基盤理論
      { from: 'mdp', to: 'q-learning', type: 'prerequisite' },
      { from: 'td-learning', to: 'q-learning', type: 'prerequisite' },
      { from: 'reward', to: 'value-function', type: 'prerequisite' },

      // 価値ベース手法
      {
        from: 'q-learning',
        to: 'dqn',
        type: 'variant',
        label: 'NNによる関数近似',
      },
      { from: 'dqn', to: 'experience-replay', type: 'component' },

      // 方策ベース手法
      { from: 'policy', to: 'policy-gradient', type: 'applies' },
      { from: 'policy-gradient', to: 'actor-critic', type: 'variant', label: '価値関数で分散低減' },
      { from: 'actor-critic', to: 'a3c', type: 'variant', label: '非同期並列化' },
      { from: 'actor-critic', to: 'ppo', type: 'variant', label: '更新幅の制限' },

      // 探索戦略
      { from: 'policy', to: 'exploration-exploitation', type: 'applies' },

      // 人間フィードバック
      { from: 'ppo', to: 'rlhf', type: 'component' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 様々な学習方法 (app-methods)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-methods',
    relations: [
      // メタ学習・少数データ学習
      { from: 'meta-learning', to: 'few-shot', type: 'applies' },
      { from: 'meta-learning', to: 'zero-shot', type: 'applies' },

      // コントラスティブ学習手法
      { from: 'contrastive-learning', to: 'simclr', type: 'variant', label: 'データ拡張ベース' },
      { from: 'contrastive-learning', to: 'moco', type: 'variant', label: 'モメンタムキュー' },

      // グラフ系
      { from: 'graph-nn', to: 'gcn', type: 'variant', label: 'グラフ上の畳み込み' },

      // 学習戦略の関係
      { from: 'few-shot', to: 'active-learning', type: 'applies' },
      { from: 'continual-learning', to: 'multi-task', type: 'applies' },
    ],
  },

  /* ──────────────────────────────────────────────
   * 説明性(XAI) (app-xai)
   * ────────────────────────────────────────────── */
  {
    subsectionId: 'app-xai',
    relations: [
      // 顕著性マップ系
      { from: 'saliency-map', to: 'grad-cam', type: 'variant', label: '勾配重み付きCAM' },
      {
        from: 'saliency-map',
        to: 'integrated-gradients',
        type: 'variant',
        label: '積分勾配',
      },

      // 特徴量重要度系
      { from: 'feature-importance', to: 'shap', type: 'variant', label: 'シャープレイ値ベース' },
      { from: 'feature-importance', to: 'lime', type: 'variant', label: '局所的線形近似' },

      // 解釈可能性の概念
      { from: 'interpretability', to: 'transparency', type: 'prerequisite' },
      { from: 'interpretability', to: 'counterfactual', type: 'applies' },
      { from: 'attention-viz', to: 'interpretability', type: 'applies' },
    ],
  },
];
