import type { TermExamPoints } from '@/types/glossary';

export const DEVOPS_EXAM_POINTS: TermExamPoints[] = [
  // ===== dev-framework（フレームワーク） =====
  {
    termId: 'pytorch',
    points: [
      '動的計算グラフ（Define-by-Run）とTensorFlowの静的計算グラフ（Define-and-Run）の違いが頻出。PyTorchは実行時にグラフを構築する。',
      'autograd による自動微分の仕組みを理解しておく。tensor.backward() でグラフを遡って勾配を計算する。',
      'TorchScript や torch.compile による本番環境への展開手法も問われることがある。',
    ],
  },
  {
    termId: 'tensorflow',
    points: [
      'TF2.x 以降は Eager Execution がデフォルトだが、tf.function でグラフモードに切り替えられる点を押さえる。',
      'SavedModel 形式でのモデル保存と TensorFlow Serving によるデプロイの流れが出題されやすい。',
      'TensorFlow Lite（モバイル向け）と TensorFlow.js（ブラウザ向け）の用途の違いを区別する。',
    ],
  },
  {
    termId: 'keras',
    points: [
      'Sequential API / Functional API / Subclassing API の3つのモデル構築方法の使い分けが問われる。',
      'TensorFlow 2.x に統合されており、tf.keras として使うのが標準。スタンドアロン版との混同に注意。',
      'callbacks（EarlyStopping, ModelCheckpoint 等）の仕組みは実務問題で頻出。',
    ],
  },
  {
    termId: 'jax',
    points: [
      'jit（Just-In-Time コンパイル）、grad（自動微分）、vmap（自動ベクトル化）の3つの主要変換を押さえる。',
      'NumPy 互換の API を持つが、配列がイミュータブルである点が大きな違い。',
      'XLA（Accelerated Linear Algebra）コンパイラで TPU/GPU の演算を最適化する仕組みを理解する。',
    ],
  },
  {
    termId: 'onnx',
    points: [
      'フレームワーク間のモデル変換（例: PyTorch → ONNX → TensorRT）の流れが出題される。',
      'ONNX Runtime による推論高速化の仕組みと、対応する演算子セット（OpSet）の概念を理解する。',
      '全ての演算子が変換可能とは限らない。カスタムオペレータの扱いが落とし穴になりやすい。',
    ],
  },
  {
    termId: 'huggingface',
    points: [
      'Transformers ライブラリの pipeline API による推論と、Trainer API によるファインチューニングの流れを押さえる。',
      'Model Hub からの事前学習モデルの取得方法と、tokenizer の役割を理解する。',
      'Datasets ライブラリによるデータの前処理・キャッシュ機能も実務問題で問われる。',
    ],
  },

  // ===== dev-light（軽量化・高速化） =====
  {
    termId: 'quantization',
    points: [
      '訓練後量子化（PTQ）と量子化対応訓練（QAT）の違いが頻出。QAT は学習中に量子化誤差を考慮するため精度低下が小さい。',
      'FP32 → FP16 → INT8 の変換でモデルサイズが削減される仕組みと、精度とのトレードオフを理解する。',
      '動的量子化と静的量子化の違い。動的は推論時に量子化パラメータを決定、静的は事前にキャリブレーションデータで決定する。',
      '枝刈り（Pruning）や知識蒸留との組み合わせで更なる軽量化が可能な点も問われる。',
    ],
  },
  {
    termId: 'pruning',
    points: [
      '非構造化枝刈り（個々の重みをゼロ化）と構造化枝刈り（フィルタ/チャネル単位で除去）の違いが重要。',
      '構造化枝刈りは実際にモデルサイズが小さくなるが、非構造化はスパース行列のままでハードウェアサポートが必要。',
      'Lottery Ticket Hypothesis（当たりくじ仮説）との関連が出題されることがある。',
    ],
  },
  {
    termId: 'knowledge-distillation',
    points: [
      '教師モデルのソフトラベル（確率分布）を使って生徒モデルを学習させる。温度パラメータ T でソフトラベルの滑らかさを調整する。',
      '損失関数は、ハードラベルとの交差エントロピーとソフトラベルとの KL ダイバージェンスの加重和となる。',
      '単にモデルを小さくするだけでなく、異なるアーキテクチャへの知識転写にも使える点を押さえる。',
    ],
    formula: 'L = α * L_soft(T) + (1 - α) * L_hard',
  },
  {
    termId: 'mixed-precision',
    points: [
      'FP16 で順伝播・逆伝播を行い、FP32 のマスターウェイトで重みを更新する仕組みが問われる。',
      'Loss Scaling（損失スケーリング）の目的を理解する。FP16 ではアンダーフローしやすいため、損失を大きな値で乗じてから逆伝播する。',
      'NVIDIA の Tensor Core を活用できるため、対応 GPU（Volta 以降）ではスループットが大幅に向上する。',
    ],
  },
  {
    termId: 'model-compression',
    points: [
      '量子化・枝刈り・知識蒸留・低ランク近似の4手法を体系的に整理しておく。それぞれの特徴と適用場面が問われる。',
      '各手法は独立ではなく組み合わせ可能。例えば「枝刈り → 知識蒸留 → 量子化」の順で適用するケースがある。',
      'エッジデバイスへのデプロイ要件（メモリ制約、レイテンシ要件）と各手法の効果を対応づけて理解する。',
    ],
  },
  {
    termId: 'tensorrt',
    points: [
      'レイヤー融合（Conv + BN + ReLU の一体化）、カーネル自動チューニング、量子化キャリブレーションの3つの最適化を押さえる。',
      'ONNX 経由でのモデル変換が一般的な流れ。PyTorch → ONNX → TensorRT のパイプラインを理解する。',
      '推論専用エンジンであり学習には使えない点に注意。また、最適化は特定の GPU アーキテクチャに依存する。',
    ],
  },
  {
    termId: 'gradient-checkpointing',
    points: [
      '順伝播時の中間活性化値を全て保持せず一部を破棄し、逆伝播時に再計算することでメモリを節約する。',
      'メモリ使用量は O(√n) に削減できるが、計算時間は約 1.3 倍に増加するトレードオフがある。',
      '大規模モデル（Transformer 系）の学習で GPU メモリ不足を解消する手段として出題される。',
    ],
  },
  {
    termId: 'sparse-computation',
    points: [
      'スパース行列の格納形式（CSR, CSC, COO 等）の違いと、それぞれの演算効率を理解しておく。',
      '枝刈り後のスパースモデルを高速に推論するにはハードウェアのスパース演算サポート（NVIDIA Ampere の Sparse Tensor Core 等）が必要。',
      '構造化スパース性（N:M スパース性、例えば 2:4）はハードウェアで直接サポートされるため、非構造化より実用的。',
    ],
  },

  // ===== dev-accel（アクセラレータ） =====
  {
    termId: 'gpu',
    points: [
      'CPU との違い：GPU は数千のコアで大量の単純な並列計算を行うのに対し、CPU は少数のコアで複雑な逐次処理に優れる。',
      'GPU メモリ（VRAM）がバッチサイズやモデルサイズの制約になる。メモリ不足時の対策（勾配チェックポインティング、混合精度等）を理解する。',
      'NVIDIA GPU の世代（Volta, Ampere, Hopper）と Tensor Core の進化を把握しておくと実務問題に対応しやすい。',
    ],
  },
  {
    termId: 'tpu',
    points: [
      'TPU は行列演算（特に大規模な行列積）に特化した設計。GPU が汎用並列計算向けなのに対し、TPU は ML ワークロード専用。',
      'TPU Pod による大規模分散学習の仕組みと、高速なチップ間接続（ICI）の特徴を押さえる。',
      'XLA コンパイラとの組み合わせで最適化される。JAX/TensorFlow との親和性が高く、PyTorch も TPU 対応が進んでいる。',
    ],
  },
  {
    termId: 'cuda',
    points: [
      'カーネル（GPU 上で実行される関数）、スレッド、ブロック、グリッドの階層構造を理解する。',
      'cuDNN（畳み込み演算の最適化）、cuBLAS（線形代数演算）等の CUDA ライブラリが深層学習フレームワークの基盤になっている。',
      'CUDA バージョンとドライババージョンの互換性は環境構築問題で問われやすい。',
    ],
  },
  {
    termId: 'distributed-training',
    points: [
      'データ並列とモデル並列の使い分けが最頻出。データが大きい場合はデータ並列、モデルが大きい場合はモデル並列。',
      '通信ボトルネック（勾配の AllReduce 等）が学習速度に影響する。Ring-AllReduce の仕組みを理解しておく。',
      '同期 SGD と非同期 SGD の違い。同期は全ワーカーの勾配を集約してから更新、非同期は各ワーカーが独立に更新する。',
      '線形スケーリング則：GPU 数を増やした場合、学習率もそれに比例して大きくする必要がある。',
    ],
  },
  {
    termId: 'data-parallel',
    points: [
      '各 GPU にモデルの完全なコピーを配置し、ミニバッチを分割して並列処理する。勾配を AllReduce で集約して同期する。',
      'PyTorch の DistributedDataParallel（DDP）と DataParallel（DP）の違い。DDP はプロセスベースで通信効率が高い。',
      '有効バッチサイズ = 1GPU あたりのバッチサイズ x GPU 数となる。バッチサイズ増加に伴う学習率調整が必要。',
    ],
  },
  {
    termId: 'model-parallel',
    points: [
      'パイプライン並列（レイヤー単位で分割）とテンソル並列（レイヤー内の演算を分割）の2種類がある。',
      'パイプライン並列ではバブル（GPU が待機する無駄時間）が発生する。マイクロバッチで軽減する手法（GPipe 等）を理解する。',
      '1つの GPU に収まらない大規模モデル（LLM 等）の学習に不可欠。データ並列との組み合わせ（3D 並列）も出題される。',
    ],
  },

  // ===== dev-env（環境構築） =====
  {
    termId: 'docker-ml',
    points: [
      'Dockerfile でベースイメージ（nvidia/cuda 等）から ML 環境を構築する流れを理解する。',
      'GPU を使うには NVIDIA Container Toolkit（旧 nvidia-docker）が必要。--gpus フラグでコンテナに GPU を割り当てる。',
      '再現性の確保が最大の利点。pip freeze や conda export で依存関係を固定し、チーム間で同一環境を共有できる。',
    ],
  },
  {
    termId: 'mlops',
    points: [
      'MLOps の成熟度レベル（手動 → パイプライン自動化 → CI/CD 自動化）の段階を理解する。',
      'データドリフト（入力データの分布変化）とコンセプトドリフト（入出力関係の変化）の監視が運用で重要。',
      'ML パイプラインの構成要素（データ収集 → 前処理 → 学習 → 評価 → デプロイ → 監視）を一連の流れで押さえる。',
      '従来の DevOps との違い：MLOps ではデータとモデルのバージョン管理が追加される点が問われる。',
    ],
  },
  {
    termId: 'experiment-tracking',
    points: [
      'ハイパーパラメータ、メトリクス、モデルアーティファクトの3要素を記録・管理する仕組みを理解する。',
      '再現性の観点から、コードのバージョン（git commit hash）、データのバージョン、環境情報も合わせて記録する重要性が問われる。',
      'MLflow や W&B 等のツールとの関連で出題される。手動管理との比較で自動化の利点を説明できるようにする。',
    ],
  },
  {
    termId: 'mlflow',
    points: [
      'Tracking（実験記録）、Projects（再現可能なコード実行）、Models（モデル管理）、Registry（モデルレジストリ）の4コンポーネントを押さえる。',
      'MLflow Tracking の log_param / log_metric / log_artifact の使い分けを理解する。',
      'オープンソースで自前サーバーに構築できる点が W&B（SaaS 型）との大きな違い。',
    ],
  },
  {
    termId: 'wandb',
    points: [
      'wandb.init() → wandb.log() → wandb.finish() の基本的な使い方を押さえる。',
      'Sweep 機能によるハイパーパラメータ自動探索（グリッド、ランダム、ベイズ最適化）が特徴的な機能。',
      'チーム間でのダッシュボード共有とレポート作成機能が MLflow にない強み。SaaS 型のため導入が容易。',
    ],
  },
  {
    termId: 'ci-cd-ml',
    points: [
      '通常の CI/CD に加えて、データの検証（スキーマチェック、分布チェック）とモデルの検証（精度閾値、推論速度）が追加される。',
      'CT（Continuous Training）の概念。新データが到着した際に自動的にモデルを再学習するパイプラインが MLOps 特有。',
      'テストの種類：ユニットテスト（コード）、データテスト（データ品質）、モデルテスト（精度・公平性）の3層を理解する。',
    ],
  },
];
