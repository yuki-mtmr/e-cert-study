export type ActivationId = 'sigmoid' | 'tanh' | 'relu';

export interface ActivationInfo {
  id: ActivationId;
  name: string;
  formula: string;
  derivativeFormula: string;
  range: string;
  keyPoint: string;
  fn: (z: number) => number;
  derivative: (z: number) => number;
}

/** σ(z) = 1 / (1 + e^-z) */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** σ'(z) = σ(z)(1 - σ(z)) */
export function sigmoidDerivative(z: number): number {
  const s = sigmoid(z);
  return s * (1 - s);
}

/** tanh(z) — Math.tanh ラッパー */
export function tanhActivation(z: number): number {
  return Math.tanh(z);
}

/** tanh'(z) = 1 - tanh²(z) */
export function tanhDerivative(z: number): number {
  const t = Math.tanh(z);
  return 1 - t * t;
}

/** ReLU(z) = max(0, z) */
export function relu(z: number): number {
  return Math.max(0, z);
}

/** ReLU'(z) = z > 0 ? 1 : 0 */
export function reluDerivative(z: number): number {
  return z > 0 ? 1 : 0;
}

/** 3つの活性化関数のメタ情報を返す */
export function getActivationInfos(): ActivationInfo[] {
  return [
    {
      id: 'sigmoid',
      name: 'Sigmoid',
      formula: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
      derivativeFormula: "\\sigma'(z) = \\sigma(z)(1 - \\sigma(z))",
      range: '(0, 1)',
      keyPoint: '|z|が大きいと勾配が0に近づく（勾配消失問題）',
      fn: sigmoid,
      derivative: sigmoidDerivative,
    },
    {
      id: 'tanh',
      name: 'tanh',
      formula: '\\tanh(z) = \\frac{e^z - e^{-z}}{e^z + e^{-z}}',
      derivativeFormula: "\\tanh'(z) = 1 - \\tanh^2(z)",
      range: '(-1, 1)',
      keyPoint: 'sigmoidと同様に勾配消失するが、出力が0中心',
      fn: tanhActivation,
      derivative: tanhDerivative,
    },
    {
      id: 'relu',
      name: 'ReLU',
      formula: '\\text{ReLU}(z) = \\max(0, z)',
      derivativeFormula: "\\text{ReLU}'(z) = \\begin{cases} 1 & z > 0 \\\\ 0 & z \\le 0 \\end{cases}",
      range: '[0, ∞)',
      keyPoint: '正の領域で勾配消失しないが、負の領域で勾配が0（dying ReLU）',
      fn: relu,
      derivative: reluDerivative,
    },
  ];
}
