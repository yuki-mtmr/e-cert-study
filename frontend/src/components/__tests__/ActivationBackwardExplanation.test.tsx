import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivationBackwardExplanation } from '../visual-explanations/ActivationBackwardExplanation';

describe('ActivationBackwardExplanation', () => {
  it('4つのセクション見出しを描画する', () => {
    const { container } = render(<ActivationBackwardExplanation />);
    const headings = container.querySelectorAll('h3');
    const texts = Array.from(headings).map((h) => h.textContent);
    expect(texts).toContainEqual(expect.stringContaining('導関数比較表'));
    expect(texts).toContainEqual(expect.stringContaining('Sigmoid'));
    expect(texts).toContainEqual(expect.stringContaining('ReLU'));
    expect(texts).toContainEqual(expect.stringContaining('Tanh'));
  });

  it('比較テーブルに3関数の行がある', () => {
    const { container } = render(<ActivationBackwardExplanation />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    // thead + 3 tbody rows
    const rows = table!.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('Sigmoid曲線チャートが描画される', () => {
    render(<ActivationBackwardExplanation />);
    expect(screen.getByLabelText('Sigmoid の関数と導関数グラフ')).toBeInTheDocument();
  });

  it('ReLUマスク動作の配列可視化が表示される', () => {
    render(<ActivationBackwardExplanation />);
    // 入力配列の値が表示されている（x行とfwd行で重複あり）
    expect(screen.getAllByText('2.5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-1.0').length).toBeGreaterThanOrEqual(1);
    // mask行のTrue/False表示
    expect(screen.getAllByText('T').length).toBe(2);
    expect(screen.getAllByText('F').length).toBe(2);
  });

  it('Tanh曲線チャートが描画される', () => {
    render(<ActivationBackwardExplanation />);
    expect(screen.getByLabelText('Tanh の関数と導関数グラフ')).toBeInTheDocument();
  });

  it('末尾に4択問題のdetailsが含まれる', () => {
    render(<ActivationBackwardExplanation />);
    expect(screen.getByText('4択問題で確認する')).toBeInTheDocument();
  });
});
