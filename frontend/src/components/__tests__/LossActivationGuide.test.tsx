import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LossActivationGuide } from '../visual-explanations/LossActivationGuide';

describe('LossActivationGuide（簡素化版）', () => {
  it('3つのタスク行を持つ比較テーブルを描画する', () => {
    const { container } = render(<LossActivationGuide />);
    const rows = container.querySelectorAll('[data-testid="task-row"]');
    expect(rows).toHaveLength(3);
  });

  it('3つのタスク名が表示される', () => {
    render(<LossActivationGuide />);
    expect(screen.getByText('2値分類')).toBeInTheDocument();
    expect(screen.getByText('多クラス分類')).toBeInTheDocument();
    expect(screen.getByText('マルチラベル分類')).toBeInTheDocument();
  });

  it('順序回帰セクションが存在しない', () => {
    render(<LossActivationGuide />);
    expect(screen.queryByText('順序回帰')).not.toBeInTheDocument();
  });

  it('活性化関数名が表示される', () => {
    render(<LossActivationGuide />);
    expect(screen.getAllByText(/シグモイド/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ソフトマックス/).length).toBeGreaterThanOrEqual(1);
  });

  it('損失関数名が表示される', () => {
    render(<LossActivationGuide />);
    expect(
      screen.getAllByText(/クロスエントロピー/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('ポイントが表示される', () => {
    render(<LossActivationGuide />);
    expect(screen.getByText(/出力は1つの確率値/)).toBeInTheDocument();
    expect(screen.getByText(/出力の合計が1/)).toBeInTheDocument();
    expect(screen.getByText(/各ラベルが独立/)).toBeInTheDocument();
  });

  it('見分け方のキールールが表示される', () => {
    render(<LossActivationGuide />);
    expect(
      screen.getByText(/排他的（1つだけ選ぶ）/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/独立（各出力が個別に0\/1）/),
    ).toBeInTheDocument();
  });

  it('KaTeX数式が存在しない', () => {
    const { container } = render(<LossActivationGuide />);
    const katexEls = container.querySelectorAll('.katex');
    expect(katexEls).toHaveLength(0);
  });

  it('「よくある誤解」セクションが存在しない', () => {
    render(<LossActivationGuide />);
    expect(screen.queryByText(/よくある誤解/)).not.toBeInTheDocument();
  });
});
