import type { SubsectionRelations } from '@/types/concept-map';

export const DEVOPS_RELATIONS: SubsectionRelations[] = [
  {
    subsectionId: 'dev-framework',
    relations: [
      { from: 'tensorflow', to: 'keras', type: 'prerequisite', label: '高レベルAPI' },
      { from: 'pytorch', to: 'onnx', type: 'applies', label: 'モデル変換' },
      { from: 'tensorflow', to: 'onnx', type: 'applies', label: 'モデル変換' },
      { from: 'pytorch', to: 'huggingface', type: 'prerequisite' },
      { from: 'jax', to: 'tensorflow', type: 'variant', label: 'Google製' },
    ],
  },
  {
    subsectionId: 'dev-light',
    relations: [
      { from: 'model-compression', to: 'quantization', type: 'component' },
      { from: 'model-compression', to: 'pruning', type: 'component' },
      { from: 'model-compression', to: 'knowledge-distillation', type: 'component' },
      { from: 'quantization', to: 'tensorrt', type: 'applies' },
      { from: 'pruning', to: 'sparse-computation', type: 'prerequisite' },
      { from: 'quantization', to: 'mixed-precision', type: 'variant', label: '学習時' },
    ],
  },
  {
    subsectionId: 'dev-accel',
    relations: [
      { from: 'gpu', to: 'cuda', type: 'prerequisite' },
      { from: 'gpu', to: 'tpu', type: 'variant', label: 'ML専用' },
      { from: 'gpu', to: 'distributed-training', type: 'prerequisite' },
      { from: 'distributed-training', to: 'data-parallel', type: 'component' },
      { from: 'distributed-training', to: 'model-parallel', type: 'component' },
    ],
  },
  {
    subsectionId: 'dev-env',
    relations: [
      { from: 'mlops', to: 'experiment-tracking', type: 'component' },
      { from: 'mlops', to: 'ci-cd-ml', type: 'component' },
      { from: 'mlops', to: 'docker-ml', type: 'component' },
      { from: 'experiment-tracking', to: 'mlflow', type: 'variant' },
      { from: 'experiment-tracking', to: 'wandb', type: 'variant' },
    ],
  },
];
