import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoftmaxCrossEntropyCodeProblem } from '../visual-explanations/SoftmaxCrossEntropyCodeProblem';

// katex をモック（jsdomでDOMパーサ不要にする）
vi.mock('katex', () => ({
  default: {
    renderToString: (latex: string) => `<span class="katex">${latex}</span>`,
  },
}));

describe('SoftmaxCrossEntropyCodeProblem', () => {
  it('パイプライン概要図を描画する', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('pipeline-overview')).toBeInTheDocument();
  });

  it('Q1〜Q4のタブボタンを表示する', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });

  it('デフォルトでQ1が選択状態', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('Q2タブクリックで切替わる', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('コードスニペット表示エリアがある', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
  });

  it('正解テキストが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('answer-text')).toBeInTheDocument();
  });

  it('解説テキストが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('explanation-text')).toBeInTheDocument();
  });

  it('Q1選択時にAxisKeepdimsデモが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('axis-keepdims-demo')).toBeInTheDocument();
  });

  it('Q4選択時にBackwardGradientチャートが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[3]);
    expect(screen.getByTestId('backward-gradient-chart')).toBeInTheDocument();
  });

  it('パイプラインボックスクリックでタブが切替わる', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const softmaxBox = screen.getByTestId('pipeline-box-softmax');
    fireEvent.click(softmaxBox);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('AxisKeepdimsDemo', () => {
  it('入力行列グリッドを表示する', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('axis-demo-grid')).toBeInTheDocument();
  });

  it('axis切替ボタンが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByRole('button', { name: 'axis=0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'axis=1' })).toBeInTheDocument();
  });

  it('axis=1がデフォルト選択', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const btn = screen.getByRole('button', { name: 'axis=1' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('max結果が表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    expect(screen.getByTestId('axis-demo-max-result')).toBeInTheDocument();
  });
});

describe('BackwardGradientChart', () => {
  it('SVGバーチャートを描画する', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[3]);
    const svg = screen.getByTestId('gradient-bar-chart');
    expect(svg).toBeInTheDocument();
  });

  it('logitsスライダーが3本表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[3]);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });

  it('正解クラス選択ボタンが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[3]);
    expect(screen.getByTestId('correct-class-selector')).toBeInTheDocument();
  });

  it('勾配の直感メモが表示される', () => {
    render(<SoftmaxCrossEntropyCodeProblem />);
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[3]);
    expect(screen.getByTestId('gradient-intuition')).toBeInTheDocument();
  });
});
