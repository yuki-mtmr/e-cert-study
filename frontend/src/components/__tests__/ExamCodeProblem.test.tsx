import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamCodeProblem } from '../visual-explanations/ExamCodeProblem';
import type { ExamCodeProblemData } from '@/lib/visual-explanations/exam-code-problem-types';

const MOCK_DATA: ExamCodeProblemData = {
  id: 'test-problem',
  title: '大問X: テスト問題',
  classCode: `class TestLayer:
    def forward(self, x):
        out = (あ)
        return out

    def backward(self, dout):
        dx = (い)
        return dx`,
  subQuestions: [
    {
      id: 'sq1',
      blankLabel: 'あ',
      number: 1,
      codeContext: 'out = (あ)',
      choices: [
        { label: 'A', code: 'x + 1' },
        { label: 'B', code: 'x * 2' },
        { label: 'C', code: 'x ** 2' },
        { label: 'D', code: 'np.exp(x)' },
      ],
      correctLabel: 'C',
      explanation: 'xの2乗を計算します。',
    },
    {
      id: 'sq2',
      blankLabel: 'い',
      number: 2,
      codeContext: 'dx = (い)',
      choices: [
        { label: 'A', code: '2 * x * dout' },
        { label: 'B', code: 'dout' },
        { label: 'C', code: 'x * dout' },
        { label: 'D', code: 'dout / x' },
      ],
      correctLabel: 'A',
      explanation: 'x^2の導関数は2xです。',
    },
  ],
};

describe('ExamCodeProblem', () => {
  it('クラスコードブロックが描画される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const codeBlock = screen.getByTestId('exam-class-code');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock.textContent).toContain('class TestLayer');
  });

  it('小問タブが正しい数だけ表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
  });

  it('デフォルトで小問1が選択状態', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('4択（A-D）がラジオボタンとして表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
  });

  it('選択なしでは「解答を確認」ボタンがdisabled', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const button = screen.getByRole('button', { name: '解答を確認' });
    expect(button).toBeDisabled();
  });

  it('選択後にボタンが有効化される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    const button = screen.getByRole('button', { name: '解答を確認' });
    expect(button).not.toBeDisabled();
  });

  it('正解選択 → 解答確認後に正解と解説が表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const radios = screen.getAllByRole('radio');
    // 小問1の正解はC（3番目）
    fireEvent.click(radios[2]);
    fireEvent.click(screen.getByRole('button', { name: '解答を確認' }));
    expect(screen.getByTestId('exam-result')).toBeInTheDocument();
    expect(screen.getByTestId('exam-result').textContent).toContain('正解');
    expect(screen.getByTestId('exam-explanation')).toBeInTheDocument();
  });

  it('不正解選択 → 解答確認後に不正解と正解が表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const radios = screen.getAllByRole('radio');
    // 小問1でAを選択（不正解）
    fireEvent.click(radios[0]);
    fireEvent.click(screen.getByRole('button', { name: '解答を確認' }));
    expect(screen.getByTestId('exam-result').textContent).toContain('不正解');
  });

  it('タブ切替で別の小問に遷移する', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    // 小問2の選択肢が表示される
    expect(screen.getByText('2 * x * dout')).toBeInTheDocument();
  });

  it('タイトルが表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    expect(screen.getByText('大問X: テスト問題')).toBeInTheDocument();
  });

  it('空欄ラベルがタブに表示される', () => {
    render(<ExamCodeProblem data={MOCK_DATA} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].textContent).toContain('あ');
    expect(tabs[1].textContent).toContain('い');
  });
});
