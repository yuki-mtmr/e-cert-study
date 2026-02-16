import type { GlossaryTerm } from '@/types/glossary';

export const DEVOPS_TERMS: GlossaryTerm[] = [
  // フレームワーク
  { id: 'pytorch', jaName: 'PyTorch', enName: 'PyTorch', description: 'Meta開発の深層学習フレームワーク。動的計算グラフで柔軟な実装が可能。研究分野で標準的。', sectionId: 'devops', subsectionId: 'dev-framework' },
  { id: 'tensorflow', jaName: 'TensorFlow', enName: 'TensorFlow', description: 'Google開発の深層学習フレームワーク。プロダクション環境での展開に強い。', sectionId: 'devops', subsectionId: 'dev-framework' },
  { id: 'keras', jaName: 'Keras', enName: 'Keras', description: '高レベルのニューラルネットワークAPI。シンプルなインターフェースで迅速なプロトタイピングが可能。', sectionId: 'devops', subsectionId: 'dev-framework' },
  { id: 'jax', jaName: 'JAX', enName: 'JAX', description: 'Google開発の数値計算ライブラリ。自動微分とXLAコンパイルで高速な数値計算を実現。', sectionId: 'devops', subsectionId: 'dev-framework' },
  { id: 'onnx', jaName: 'ONNX', enName: 'Open Neural Network Exchange', description: 'NN モデルの相互運用フォーマット。異なるフレームワーク間でモデルを変換・共有できる。', sectionId: 'devops', subsectionId: 'dev-framework' },
  { id: 'huggingface', jaName: 'Hugging Face', enName: 'Hugging Face', description: '事前学習モデルとデータセットのプラットフォーム。Transformersライブラリで広く知られる。', sectionId: 'devops', subsectionId: 'dev-framework' },
  // 軽量化・高速化
  { id: 'quantization', jaName: '量子化', enName: 'Quantization', description: 'モデルの重みを低ビット（INT8等）に変換して推論を高速化・軽量化する手法。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'pruning', jaName: '枝刈り', enName: 'Pruning', description: '不要な重みやニューロンを除去してモデルを軽量化する手法。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'knowledge-distillation', jaName: '知識蒸留', enName: 'Knowledge Distillation', description: '大きな教師モデルの知識を小さな生徒モデルに転写する手法。軽量化と精度のバランスを実現。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'mixed-precision', jaName: '混合精度学習', enName: 'Mixed Precision Training', description: 'FP16とFP32を混合して計算する学習手法。メモリ使用量と計算時間を削減する。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'model-compression', jaName: 'モデル圧縮', enName: 'Model Compression', description: 'モデルサイズを削減する手法の総称。量子化、枝刈り、知識蒸留等を含む。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'tensorrt', jaName: 'TensorRT', enName: 'TensorRT', description: 'NVIDIA製の推論最適化エンジン。グラフ最適化や量子化でGPU推論を高速化する。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'gradient-checkpointing', jaName: '勾配チェックポインティング', enName: 'Gradient Checkpointing', description: '一部の中間結果を再計算することでメモリ使用量を削減する手法。大規模モデルの学習に有効。', sectionId: 'devops', subsectionId: 'dev-light' },
  { id: 'sparse-computation', jaName: 'スパース計算', enName: 'Sparse Computation', description: '疎な重み行列を活用して不要な計算を省略する高速化手法。', sectionId: 'devops', subsectionId: 'dev-light' },
  // アクセラレータ
  { id: 'gpu', jaName: 'GPU', enName: 'Graphics Processing Unit', description: '大量の並列計算に特化したプロセッサ。深層学習の学習・推論を大幅に高速化する。', sectionId: 'devops', subsectionId: 'dev-accel' },
  { id: 'tpu', jaName: 'TPU', enName: 'Tensor Processing Unit', description: 'Google開発のML専用チップ。行列演算に最適化された高スループットのアクセラレータ。', sectionId: 'devops', subsectionId: 'dev-accel' },
  { id: 'cuda', jaName: 'CUDA', enName: 'Compute Unified Device Architecture', description: 'NVIDIA GPU上で汎用計算を行うプラットフォーム。深層学習フレームワークの基盤。', sectionId: 'devops', subsectionId: 'dev-accel' },
  { id: 'distributed-training', jaName: '分散学習', enName: 'Distributed Training', description: '複数のGPU/ノードでモデルの学習を並列化する手法。大規模モデルの学習に不可欠。', sectionId: 'devops', subsectionId: 'dev-accel' },
  { id: 'data-parallel', jaName: 'データ並列', enName: 'Data Parallelism', description: 'データを分割して複数GPUで同じモデルを並列学習する手法。最も一般的な並列化方法。', sectionId: 'devops', subsectionId: 'dev-accel' },
  { id: 'model-parallel', jaName: 'モデル並列', enName: 'Model Parallelism', description: 'モデルを分割して複数GPUに配置する手法。1つのGPUに収まらない大規模モデルに必要。', sectionId: 'devops', subsectionId: 'dev-accel' },
  // 環境構築
  { id: 'docker-ml', jaName: 'Docker', enName: 'Docker', description: 'コンテナ技術でML環境を再現可能にするツール。依存関係の管理と環境の一貫性を確保。', sectionId: 'devops', subsectionId: 'dev-env' },
  { id: 'mlops', jaName: 'MLOps', enName: 'MLOps', description: 'MLモデルの開発・デプロイ・運用を自動化する手法論。CI/CD・監視・再学習を含む。', sectionId: 'devops', subsectionId: 'dev-env' },
  { id: 'experiment-tracking', jaName: '実験管理', enName: 'Experiment Tracking', description: 'ハイパーパラメータ・メトリクス・モデルを記録して実験を管理する仕組み。', sectionId: 'devops', subsectionId: 'dev-env' },
  { id: 'mlflow', jaName: 'MLflow', enName: 'MLflow', description: 'ML実験管理・モデル管理・デプロイを支援するオープンソースプラットフォーム。', sectionId: 'devops', subsectionId: 'dev-env' },
  { id: 'wandb', jaName: 'Weights & Biases', enName: 'Weights & Biases', description: 'ML実験のトラッキング・可視化・チーム共有を行うプラットフォーム。', sectionId: 'devops', subsectionId: 'dev-env' },
  { id: 'ci-cd-ml', jaName: 'CI/CD', enName: 'Continuous Integration/Continuous Deployment', description: 'コードの統合・テスト・デプロイを自動化するプラクティス。MLパイプラインにも適用される。', sectionId: 'devops', subsectionId: 'dev-env' },
];
