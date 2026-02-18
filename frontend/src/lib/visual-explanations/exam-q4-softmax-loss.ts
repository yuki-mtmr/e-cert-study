import type { ExamCodeProblemData } from './exam-code-problem-types';

export const examQ4Data: ExamCodeProblemData = {
  id: 'exam-q4-softmax-loss',
  title: '大問4: SoftmaxWithLoss',
  classCode: `class SoftmaxWithLoss:
    def __init__(self):
        self.loss = None
        self.y = None
        self.t = None

    def forward(self, x, t):
        self.t = t
        self.y = softmax(x)
        self.loss = cross_entropy_error( (う) )
        return self.loss

    def backward(self, dout=1):
        batch_size = self.t.shape[0]
        dx = (え)
        return dx

def softmax(x):
    c = np.max(x, (あ) )
    exp_x = np.exp(x - c)
    sum_exp_x = np.sum(exp_x, (あ) )
    return exp_x / sum_exp_x

def cross_entropy_error(y, t):
    batch_size = y.shape[0]
    return (い)`,
  subQuestions: [
    {
      id: 'q4-sq1',
      blankLabel: 'あ',
      number: 1,
      codeContext: 'c = np.max(x, (あ) )  /  sum_exp_x = np.sum(exp_x, (あ) )',
      choices: [
        { label: 'A', code: 'axis=0, keepdims=True' },
        { label: 'B', code: 'axis=1' },
        { label: 'C', code: 'axis=0' },
        { label: 'D', code: 'axis=1, keepdims=True' },
      ],
      correctLabel: 'D',
      explanation:
        'バッチ処理ではaxis=1（各サンプル方向）でmax/sumを取ります。keepdims=Trueにより形状が(batch_size, 1)となり、ブロードキャストで正しく引き算・割り算ができます。',
    },
    {
      id: 'q4-sq2',
      blankLabel: 'い',
      number: 2,
      codeContext: 'return (い)',
      choices: [
        {
          label: 'A',
          code: '-np.sum(np.log(y[np.arange(batch_size), t])) / batch_size',
        },
        {
          label: 'B',
          code: '-np.sum(t * np.log(y)) / batch_size',
        },
        {
          label: 'C',
          code: '-np.log(y[t]) / batch_size',
        },
        {
          label: 'D',
          code: 'np.sum(-np.log(y)) / batch_size',
        },
      ],
      correctLabel: 'A',
      explanation:
        'np.arange(batch_size)とtを使ったファンシーインデックスで、各サンプルの正解クラスの確率だけを取り出します。one-hot形式ではなくラベル形式（整数）の教師信号に対応する書き方です。',
    },
    {
      id: 'q4-sq3',
      blankLabel: 'う',
      number: 3,
      codeContext: 'self.loss = cross_entropy_error( (う) )',
      choices: [
        { label: 'A', code: 'self.t, self.y' },
        { label: 'B', code: 'x, self.t' },
        { label: 'C', code: 'self.y, self.t' },
        { label: 'D', code: 'self.y, x' },
      ],
      correctLabel: 'C',
      explanation:
        'cross_entropy_errorの第1引数はsoftmax出力(y)、第2引数は教師ラベル(t)です。forwardでは先にself.y = softmax(x)を計算してから、CE(self.y, self.t)で損失を求めます。',
    },
    {
      id: 'q4-sq4',
      blankLabel: 'え',
      number: 4,
      codeContext: 'dx = (え)',
      choices: [
        { label: 'A', code: 'self.y - self.t' },
        { label: 'B', code: '(self.y - self.t) / batch_size' },
        { label: 'C', code: '(self.t - self.y) / batch_size' },
        { label: 'D', code: 'self.y / self.t / batch_size' },
      ],
      correctLabel: 'B',
      explanation:
        'Softmax+CEの逆伝播は (y - t) / N というシンプルな形になります。batch_sizeで割ることで、1サンプルあたりの勾配にスケーリングします。これはSoftmaxとCEを組み合わせたときの微分の美しい性質です。',
    },
  ],
};
