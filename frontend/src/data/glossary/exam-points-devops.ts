import type { TermExamPoints } from '@/types/glossary';

export const DEVOPS_EXAM_POINTS: TermExamPoints[] = [
  // ===== dev-framework（フレームワーク） =====
  {
    termId: 'pytorch',
    points: ['動的計算グラフ(Define-by-Run)、autograd(tensor.backward())で自動微分'],
  },
  {
    termId: 'tensorflow',
    points: ['TF2.xはEager実行がデフォルト、tf.functionでグラフモード、SavedModel+TF Servingでデプロイ'],
  },
  {
    termId: 'keras',
    points: ['Sequential/Functional/Subclassingの3種API、tf.kerasとして使用が標準'],
  },
  {
    termId: 'jax',
    points: ['jit(JITコンパイル)+grad(自動微分)+vmap(ベクトル化)の3主要変換、配列はイミュータブル'],
  },
  {
    termId: 'onnx',
    points: ['フレームワーク間モデル変換(PyTorch→ONNX→TensorRT)、全演算子が変換可能とは限らない'],
  },
  {
    termId: 'huggingface',
    points: ['pipeline APIで推論、Trainer APIでFT、Model Hubから事前学習モデル取得'],
  },

  // ===== dev-light（軽量化・高速化） =====
  {
    termId: 'quantization',
    points: ['PTQ(訓練後)vsQAT(量子化対応訓練)、FP32→FP16→INT8、動的vs静的量子化の違い'],
  },
  {
    termId: 'pruning',
    points: ['非構造化(個々の重み→スパース)vs構造化(フィルタ/チャネル単位→実サイズ削減)'],
  },
  {
    termId: 'knowledge-distillation',
    points: ['Teacher→Studentにソフトラベル(温度Tで滑らかさ調整)で学習、異アーキテクチャ間も可'],
    formula: 'L = α * L_soft(T) + (1 - α) * L_hard',
  },
  {
    termId: 'mixed-precision',
    points: ['FP16で順/逆伝播+FP32マスターウェイト、Loss Scalingでアンダーフロー防止'],
  },
  {
    termId: 'model-compression',
    points: ['量子化/枝刈り/知識蒸留/低ランク近似の4手法、組み合わせ可能(枝刈り→蒸留→量子化)'],
  },
  {
    termId: 'tensorrt',
    points: ['レイヤー融合+カーネル自動チューニング+量子化、推論専用(学習不可)、GPU依存'],
  },
  {
    termId: 'gradient-checkpointing',
    points: ['中間活性化を破棄→逆伝播時に再計算、メモリO(√n)に削減だが計算約1.3倍増'],
  },
  {
    termId: 'sparse-computation',
    points: ['構造化スパース性(2:4 N:M)はHWサポートあり→非構造化より実用的'],
  },

  // ===== dev-accel（アクセラレータ） =====
  {
    termId: 'gpu',
    points: ['CPU=少数コアで複雑逐次処理、GPU=数千コアで大量単純並列、VRAMがバッチ/モデルサイズ制約'],
  },
  {
    termId: 'tpu',
    points: ['行列演算特化(GPU汎用vs TPU ML専用)、TPU Pod+ICI高速接続で大規模分散学習'],
  },
  {
    termId: 'cuda',
    points: ['カーネル/スレッド/ブロック/グリッドの階層、cuDNN(畳み込み)/cuBLAS(線形代数)が基盤'],
  },
  {
    termId: 'distributed-training',
    points: ['データ並列(データ大)vsモデル並列(モデル大)、Ring-AllReduceで勾配集約、線形スケーリング則'],
  },
  {
    termId: 'data-parallel',
    points: ['各GPUにモデルコピー→バッチ分割→AllReduceで勾配同期、DDP>DP(プロセスベースで高効率)'],
  },
  {
    termId: 'model-parallel',
    points: ['パイプライン並列(層単位)vsテンソル並列(層内演算分割)、バブル軽減にマイクロバッチ(GPipe)'],
  },

  // ===== dev-env（環境構築） =====
  {
    termId: 'docker-ml',
    points: ['nvidia/cudaベースイメージ+NVIDIA Container Toolkit(--gpus)、再現性確保が最大の利点'],
  },
  {
    termId: 'mlops',
    points: ['手動→パイプライン自動化→CI/CD自動化の成熟度、データドリフト/コンセプトドリフト監視'],
  },
  {
    termId: 'experiment-tracking',
    points: ['ハイパーパラメータ+メトリクス+アーティファクトを記録、コード/データのバージョンも含めて再現性確保'],
  },
  {
    termId: 'mlflow',
    points: ['Tracking/Projects/Models/Registryの4コンポーネント、OSSで自前構築可(W&BはSaaS)'],
  },
  {
    termId: 'wandb',
    points: ['init→log→finishの基本フロー、Sweep(HP自動探索)、SaaS型でチーム共有が容易'],
  },
  {
    termId: 'ci-cd-ml',
    points: ['通常CI/CD+データ検証+モデル検証、CT(Continuous Training)=新データ到着で自動再学習'],
  },
];
