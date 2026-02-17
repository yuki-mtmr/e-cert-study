import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfusionMatrix } from '@/components/visual-explanations/ConfusionMatrix';

describe('ConfusionMatrix', () => {
  it('「一言で」見出しを表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('一言で')).toBeInTheDocument();
  });

  it('サマリーテキストを表示する', () => {
    render(<ConfusionMatrix />);
    const summary = screen.getByTestId('cm-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('TP/FP/FN/TN');
  });

  it('「混同行列」見出しを表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('混同行列')).toBeInTheDocument();
  });

  it('マトリクスセルを4つ表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByTestId('matrix-cell-tp')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-fn')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-fp')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-tn')).toBeInTheDocument();
  });

  it('行列ヘッダーを表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('予測: 陽性')).toBeInTheDocument();
    expect(screen.getByText('予測: 陰性')).toBeInTheDocument();
    expect(screen.getByText('実際: 陽性')).toBeInTheDocument();
    expect(screen.getByText('実際: 陰性')).toBeInTheDocument();
  });

  it('「導出される指標」見出しを表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('導出される指標')).toBeInTheDocument();
  });

  it('指標カードを6つ表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByTestId('metric-card-accuracy')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-precision')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-recall')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-f1')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-fpr')).toBeInTheDocument();
    expect(screen.getByTestId('metric-card-fnr')).toBeInTheDocument();
  });

  it('指標名を全て表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('正解率')).toBeInTheDocument();
    expect(screen.getByText('適合率')).toBeInTheDocument();
    expect(screen.getByText('再現率')).toBeInTheDocument();
    expect(screen.getByText('F1スコア')).toBeInTheDocument();
    expect(screen.getByText('偽陽性率')).toBeInTheDocument();
    expect(screen.getByText('偽陰性率')).toBeInTheDocument();
  });

  it('英語名を全て表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Precision')).toBeInTheDocument();
    expect(screen.getByText('Recall')).toBeInTheDocument();
    expect(screen.getByText('F1 Score')).toBeInTheDocument();
    expect(screen.getByText('FPR')).toBeInTheDocument();
    expect(screen.getByText('FNR')).toBeInTheDocument();
  });

  it('覚え方 tip を全て表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText(/全部の中から正解したやつの比率/)).toBeInTheDocument();
    expect(screen.getByText(/予測で陽性と言った中で本当に陽性/)).toBeInTheDocument();
    expect(screen.getByText(/実際の陽性をどれだけ見つけた/)).toBeInTheDocument();
  });

  it('指標カードクリックでマトリクスセルにハイライトが適用される', () => {
    render(<ConfusionMatrix />);
    fireEvent.click(screen.getByTestId('metric-card-precision'));
    // TP は分子 → 強ハイライト
    expect(screen.getByTestId('matrix-cell-tp').className).toContain('ring-2');
    // FP は分母のみ → 薄ハイライト
    expect(screen.getByTestId('matrix-cell-fp').className).toContain('opacity-70');
    // FN, TN は無関係 → フェードアウト
    expect(screen.getByTestId('matrix-cell-fn').className).toContain('opacity-20');
    expect(screen.getByTestId('matrix-cell-tn').className).toContain('opacity-20');
  });

  it('同じ指標カードを再クリックでハイライトが解除される', () => {
    render(<ConfusionMatrix />);
    const card = screen.getByTestId('metric-card-precision');
    // 1回目: 選択
    fireEvent.click(card);
    expect(screen.getByTestId('matrix-cell-tp').className).toContain('ring-2');
    // 2回目: 解除
    fireEvent.click(card);
    expect(screen.getByTestId('matrix-cell-tp').className).not.toContain('ring-2');
    expect(screen.getByTestId('matrix-cell-fp').className).not.toContain('opacity-70');
  });
});
