import type { ExamCodeProblemData } from './exam-code-problem-types';

export const examQ8Data: ExamCodeProblemData = {
  id: 'exam-q8-optimizer',
  title: '大問8: SGD最適化手法（Momentum / NAG）',
  classCode: `class Momentum:
    def __init__(self, lr=0.01, momentum=0.9):
        self.lr = lr         # η: 学習率
        self.momentum = momentum  # γ: 慣性係数
        self.v = None

    def update(self, params, grads):
        if self.v is None:
            self.v = {}
            for key, val in params.items():
                self.v[key] = np.zeros_like(val)

        for key in params.keys():
            self.v[key] = (あ)
            params[key] -= self.v[key]

class Nesterov:
    def __init__(self, lr=0.01, momentum=0.9):
        self.lr = lr
        self.momentum = momentum
        self.v = None

    def update(self, params, grads):
        if self.v is None:
            self.v = {}
            for key, val in params.items():
                self.v[key] = np.zeros_like(val)

        for key in params.keys():
            self.v[key] = (い)
            params[key] -= self.v[key]`,
  subQuestions: [
    {
      id: 'q8-sq1',
      blankLabel: 'あ',
      number: 1,
      codeContext: 'self.v[key] = (あ)',
      choices: [
        {
          label: 'A',
          code: 'self.momentum * self.v[key] - self.lr * grads[key]',
        },
        {
          label: 'B',
          code: 'self.momentum * self.v[key] + self.lr * grads[key]',
        },
        {
          label: 'C',
          code: 'self.lr * self.v[key] + self.momentum * grads[key]',
        },
        {
          label: 'D',
          code: 'self.lr * self.v[key] - self.momentum * grads[key]',
        },
      ],
      correctLabel: 'B',
      explanation:
        'Momentum更新式: v = γv + η∇J。γ(~0.9)はv_{t-1}に、η(~0.01)は∇Jに掛かる。C/Dはγとηの位置が逆。Aは符号がマイナスだが、params -= v で引くので v 内部はプラスが正しい。',
    },
    {
      id: 'q8-sq2',
      blankLabel: 'い',
      number: 2,
      codeContext: 'self.v[key] = (い)',
      choices: [
        {
          label: 'A',
          code: 'self.momentum * self.v[key] + self.lr * grads[key]',
        },
        {
          label: 'B',
          code: 'self.lr * self.v[key] + self.momentum * grads[key]',
        },
        {
          label: 'C',
          code: 'self.momentum * self.v[key] + self.lr * np.gradient(params[key])',
        },
        {
          label: 'D',
          code: 'self.momentum * self.v[key] + self.lr * grads[key - self.momentum * self.v[key]]',
        },
      ],
      correctLabel: 'D',
      explanation:
        'NAG更新式: v = γv + η∇J(θ - γv)。4択で ∇J の引数が θ でないのは D だけ。NAGは「先読み位置」θ-γv で勾配を評価する点がMomentumとの唯一の違い。',
    },
    {
      id: 'q8-sq3',
      blankLabel: 'う',
      number: 3,
      codeContext:
        'Pathological Curvature（病的曲率）に関して不適切なものを選べ',
      choices: [
        {
          label: 'A',
          code: 'SGDでは谷の壁に沿って振動が起き、収束が遅くなる',
        },
        {
          label: 'B',
          code: 'SGDは局所最小値に陥りやすい問題である',
        },
        {
          label: 'C',
          code: 'Momentumは慣性により振動を抑制し、収束を加速する',
        },
        {
          label: 'D',
          code: '損失関数の等高線が細長い楕円状になる現象である',
        },
      ],
      correctLabel: 'B',
      explanation:
        'Pathological Curvatureは「振動→収束遅延」の問題であり、「局所最小値に陥る」とは全く別の現象。Bだけが概念を混同している。A/C/Dはいずれも正しい記述。',
    },
  ],
};
