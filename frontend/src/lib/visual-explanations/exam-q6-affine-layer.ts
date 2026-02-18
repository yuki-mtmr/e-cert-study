import type { ExamCodeProblemData } from './exam-code-problem-types';

export const examQ6Data: ExamCodeProblemData = {
  id: 'exam-q6-affine-layer',
  title: '大問6: Affineレイヤー',
  classCode: `class Affine:
    def __init__(self, W, b):
        self.W = W
        self.b = b
        self.x = None
        self.dW = None
        self.db = None

    def forward(self, x):
        self.x = x
        out = np.dot( (あ) ) + self.b
        return out

    def backward(self, dout):
        dx = np.dot( (い) )
        self.dW = np.dot( (う) )
        self.db = np.sum( (え), axis=0 )
        return dx`,
  subQuestions: [
    {
      id: 'q6-sq1',
      blankLabel: 'あ',
      number: 1,
      codeContext: 'out = np.dot( (あ) ) + self.b',
      choices: [
        { label: 'A', code: 'self.x, self.W' },
        { label: 'B', code: 'self.W, self.x' },
        { label: 'C', code: 'self.x.T, self.W' },
        { label: 'D', code: 'self.W.T, self.x' },
      ],
      correctLabel: 'A',
      explanation:
        'Affineレイヤーのforward: out = x・W + b。入力x(batch_size, input_dim)と重みW(input_dim, output_dim)の行列積です。行列の形状を考えると np.dot(x, W) の順序が正しいことがわかります。',
    },
    {
      id: 'q6-sq2',
      blankLabel: 'い',
      number: 2,
      codeContext: 'dx = np.dot( (い) )',
      choices: [
        { label: 'A', code: 'self.x.T, dout' },
        { label: 'B', code: 'dout, self.x' },
        { label: 'C', code: 'self.W, dout.T' },
        { label: 'D', code: 'dout, self.W.T' },
      ],
      correctLabel: 'D',
      explanation:
        'dx = dout・W^T。dout(batch_size, output_dim)とW^T(output_dim, input_dim)の積で、入力と同じ形状(batch_size, input_dim)のdxが得られます。',
    },
    {
      id: 'q6-sq3',
      blankLabel: 'う',
      number: 3,
      codeContext: 'self.dW = np.dot( (う) )',
      choices: [
        { label: 'A', code: 'dout, self.x.T' },
        { label: 'B', code: 'self.x, dout' },
        { label: 'C', code: 'self.x.T, dout' },
        { label: 'D', code: 'dout.T, self.x' },
      ],
      correctLabel: 'C',
      explanation:
        'dW = x^T・dout。x^T(input_dim, batch_size)とdout(batch_size, output_dim)の積で、Wと同じ形状(input_dim, output_dim)のdWが得られます。',
    },
    {
      id: 'q6-sq4',
      blankLabel: 'え',
      number: 4,
      codeContext: 'self.db = np.sum( (え), axis=0 )',
      choices: [
        { label: 'A', code: 'dout' },
        { label: 'B', code: 'self.x' },
        { label: 'C', code: 'dx' },
        { label: 'D', code: 'self.dW' },
      ],
      correctLabel: 'A',
      explanation:
        'db = Σ dout (axis=0)。バイアスbはバッチ内の全サンプルで共有されるため、doutをバッチ方向(axis=0)に合計します。結果の形状は(output_dim,)でbと一致します。',
    },
  ],
};
