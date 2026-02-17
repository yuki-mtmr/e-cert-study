import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('セル内に略称を表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByTestId('matrix-cell-tp')).toHaveTextContent('TP');
    expect(screen.getByTestId('matrix-cell-fn')).toHaveTextContent('FN');
    expect(screen.getByTestId('matrix-cell-fp')).toHaveTextContent('FP');
    expect(screen.getByTestId('matrix-cell-tn')).toHaveTextContent('TN');
  });

  it('「導出される指標」見出しを表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('導出される指標')).toBeInTheDocument();
  });

  it('指標カードを4つ表示する', () => {
    render(<ConfusionMatrix />);
    const cards = screen.getAllByTestId('metric-formula');
    expect(cards).toHaveLength(4);
  });

  it('指標名を全て表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('正解率')).toBeInTheDocument();
    expect(screen.getByText('適合率')).toBeInTheDocument();
    expect(screen.getByText('再現率')).toBeInTheDocument();
    expect(screen.getByText('F1スコア')).toBeInTheDocument();
  });

  it('英語名を全て表示する', () => {
    render(<ConfusionMatrix />);
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Precision')).toBeInTheDocument();
    expect(screen.getByText('Recall')).toBeInTheDocument();
    expect(screen.getByText('F1 Score')).toBeInTheDocument();
  });
});
