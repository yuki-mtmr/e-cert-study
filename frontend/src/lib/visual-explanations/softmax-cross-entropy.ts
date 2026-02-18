// Softmax + Cross-Entropy コード問題解説 データ層

export type QuestionId =
  | 'q1-axis-keepdims'
  | 'q2-ce-return'
  | 'q3-forward-args'
  | 'q4-backward-grad';

export interface QuestionMeta {
  id: QuestionId;
  number: number;
  title: string;
  codeSnippet: string;
  answer: string;
  answerLatex: string;
  explanation: string;
}

export interface AxisDemoResult {
  original: number[][];
  maxAxis0: number[];
  maxAxis1: number[];
  keepdimsAxis1: number[][];
  subtracted: number[][];
}

export interface GradientBar {
  classIndex: number;
  label: string;
  yValue: number;
  tValue: number;
  dxValue: number;
}

export const PIPELINE_COLORS = {
  input: { hex: '#6B7280', tailwind: 'gray' },
  softmax: { hex: '#3B82F6', tailwind: 'blue' },
  teacher: { hex: '#10B981', tailwind: 'emerald' },
  loss: { hex: '#EF4444', tailwind: 'red' },
  gradient: { hex: '#F59E0B', tailwind: 'amber' },
} as const;

/** 4つの設問メタデータ */
export function getQuestions(): QuestionMeta[] {
  return [
    {
      id: 'q1-axis-keepdims',
      number: 1,
      title: 'softmax: axis と keepdims',
      codeSnippet: 'x - np.max(x, axis=【?】, keepdims=True)',
      answer: 'axis=1, keepdims=True',
      answerLatex: '\\text{axis}=1,\\; \\text{keepdims}=\\text{True}',
      explanation:
        'axis=1で行方向の最大値を取り、keepdims=Trueで形状(N,1)を保持してブロードキャスト減算する。数値安定性のためexp前にmaxを引く。',
    },
    {
      id: 'q2-ce-return',
      number: 2,
      title: 'クロスエントロピー: 戻り値',
      codeSnippet: 'return -np.sum(np.log(y[np.arange(batch_size), t])) / batch_size',
      answer: '-np.sum(np.log(y[np.arange(batch_size), t])) / batch_size',
      answerLatex:
        'L = -\\frac{1}{N}\\sum_{i=1}^{N} \\log y_{i, t_i}',
      explanation:
        'np.arange(batch_size)とtで各サンプルの正解クラスの予測確率を取得し、-logの平均を返す。',
    },
    {
      id: 'q3-forward-args',
      number: 3,
      title: 'forward: 引数の順序',
      codeSnippet: 'self.y = softmax(x)\nself.t = t\nself.loss = cross_entropy(self.y, self.t)',
      answer: 'cross_entropy(self.y, self.t)',
      answerLatex:
        '\\text{loss} = \\text{CE}(\\text{softmax}(x),\\; t)',
      explanation:
        'forwardではsoftmax出力self.yと教師ラベルself.tをそのままCEに渡す。self.yとself.tはbackwardで再利用するため保存する。',
    },
    {
      id: 'q4-backward-grad',
      number: 4,
      title: 'backward: 勾配計算',
      codeSnippet: 'dx = (self.y - self.t) / batch_size',
      answer: '(self.y - self.t) / batch_size',
      answerLatex:
        '\\frac{\\partial L}{\\partial x} = \\frac{y - t}{N}',
      explanation:
        'Softmax+CEの逆伝播は (y - t)/N というシンプルな式になる。正解に近いほど勾配が小さく更新量が減る。',
    },
  ];
}

/** 1D softmax（数値安定版: max引き後にexp） */
export function softmax1D(x: number[]): number[] {
  if (x.length === 0) return [];
  const max = Math.max(...x);
  const exps = x.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** axis/keepdimsデモデータ生成 */
export function computeAxisDemo(
  matrix: number[][] = [
    [2.0, 1.0, 0.1],
    [1.0, 3.0, 0.2],
  ],
): AxisDemoResult {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // axis=0: 列方向の最大値
  const maxAxis0: number[] = [];
  for (let c = 0; c < cols; c++) {
    let colMax = -Infinity;
    for (let r = 0; r < rows; r++) {
      if (matrix[r][c] > colMax) colMax = matrix[r][c];
    }
    maxAxis0.push(colMax);
  }

  // axis=1: 行方向の最大値
  const maxAxis1: number[] = matrix.map((row) => Math.max(...row));

  // keepdims=True: 形状(N,1)を保持
  const keepdimsAxis1: number[][] = maxAxis1.map((v) => [v]);

  // x - max(axis=1, keepdims=True)
  const subtracted: number[][] = matrix.map((row, r) =>
    row.map((v) => v - maxAxis1[r]),
  );

  return {
    original: matrix,
    maxAxis0,
    maxAxis1,
    keepdimsAxis1,
    subtracted,
  };
}

/** クロスエントロピー計算: -log(y[tIndex]) */
export function crossEntropyLoss(y: number[], tIndex: number): number {
  return -Math.log(y[tIndex]);
}

/** backward勾配: (y - oneHot(t)) / batchSize */
export function computeGradient(
  y: number[],
  tIndex: number,
  batchSize = 1,
): GradientBar[] {
  return y.map((yVal, i) => {
    const tVal = i === tIndex ? 1 : 0;
    return {
      classIndex: i,
      label: `class ${i}`,
      yValue: yVal,
      tValue: tVal,
      dxValue: (yVal - tVal) / batchSize,
    };
  });
}
