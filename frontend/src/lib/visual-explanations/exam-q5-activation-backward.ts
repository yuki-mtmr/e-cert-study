import type { ExamCodeProblemData } from './exam-code-problem-types';

export const examQ5Data: ExamCodeProblemData = {
  id: 'exam-q5-activation-backward',
  title: '大問5: 活性化関数の逆伝播',
  classCode: `class Sigmoid:
    def __init__(self):
        self.out = None

    def forward(self, x):
        out = 1.0 / (1.0 + np.exp(-x))
        self.out = out
        return out

    def backward(self, dout):
        dx = (あ)
        return dx

class Relu:
    def __init__(self):
        self.mask = None

    def forward(self, x):
        self.mask = (x <= 0)
        out = x.copy()
        out[self.mask] = (い)
        return out

    def backward(self, dout):
        dout[self.mask] = (い)
        dx = dout
        return dx

class Tanh:
    def __init__(self):
        self.out = None

    def forward(self, x):
        self.out = np.tanh(x)
        return self.out

    def backward(self, dout):
        tanh_out = self.out
        dx = (う)
        return dx`,
  subQuestions: [
    {
      id: 'q5-sq1',
      blankLabel: 'あ',
      number: 1,
      codeContext: 'dx = (あ)  # Sigmoid backward',
      choices: [
        { label: 'A', code: 'dout * self.out' },
        { label: 'B', code: 'dout * (1.0 - self.out)' },
        { label: 'C', code: 'dout * (1.0 - self.out) * self.out' },
        { label: 'D', code: 'dout * self.out * self.out' },
      ],
      correctLabel: 'C',
      explanation:
        "Sigmoidの微分は σ'(x) = σ(x)(1 - σ(x)) です。forwardで保存したself.out = σ(x)を使い、dout * (1 - self.out) * self.out が逆伝播の式になります。",
    },
    {
      id: 'q5-sq2',
      blankLabel: 'い',
      number: 2,
      codeContext: 'out[self.mask] = (い)  /  dout[self.mask] = (い)  # ReLU',
      choices: [
        { label: 'A', code: '1' },
        { label: 'B', code: '0' },
        { label: 'C', code: '-1' },
        { label: 'D', code: 'x' },
      ],
      correctLabel: 'B',
      explanation:
        'ReLUは入力が0以下のとき出力を0にします（forward）。逆伝播でも同じマスク位置の勾配を0にします（backward）。x > 0の領域では勾配をそのまま通します。',
    },
    {
      id: 'q5-sq3',
      blankLabel: 'う',
      number: 3,
      codeContext: 'dx = (う)  # Tanh backward',
      choices: [
        { label: 'A', code: '(1.0 - tanh_out) * dout' },
        { label: 'B', code: 'tanh_out * (1.0 - tanh_out) * dout' },
        { label: 'C', code: '(1.0 + tanh_out**2) * dout' },
        { label: 'D', code: '(1.0 - tanh_out**2) * dout' },
      ],
      correctLabel: 'D',
      explanation:
        "tanhの微分は tanh'(x) = 1 - tanh²(x) です。forwardで保存したself.out = tanh(x)を使い、(1 - tanh_out²) * dout が逆伝播の式になります。Sigmoidと混同しやすいので注意。",
    },
  ],
};
