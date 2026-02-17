import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfusionMatrixGrid } from '@/components/visual-explanations/ConfusionMatrixGrid';
import type { HighlightGroup } from '@/lib/visual-explanations/confusion-matrix';

describe('ConfusionMatrixGrid', () => {
  it('4つのマトリクスセルを表示する', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    expect(screen.getByTestId('matrix-cell-tp')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-fn')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-fp')).toBeInTheDocument();
    expect(screen.getByTestId('matrix-cell-tn')).toBeInTheDocument();
  });

  it('列ヘッダーを表示する', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    expect(screen.getByText('予測: 陽性')).toBeInTheDocument();
    expect(screen.getByText('予測: 陰性')).toBeInTheDocument();
  });

  it('行ヘッダーを表示する', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    expect(screen.getByText('実際: 陽性')).toBeInTheDocument();
    expect(screen.getByText('実際: 陰性')).toBeInTheDocument();
  });

  it('各セルに略称を表示する', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    expect(screen.getByTestId('matrix-cell-tp')).toHaveTextContent('TP');
    expect(screen.getByTestId('matrix-cell-fn')).toHaveTextContent('FN');
    expect(screen.getByTestId('matrix-cell-fp')).toHaveTextContent('FP');
    expect(screen.getByTestId('matrix-cell-tn')).toHaveTextContent('TN');
  });

  it('highlight=null の場合、全セルがフェードなし', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    const tp = screen.getByTestId('matrix-cell-tp');
    expect(tp.className).not.toContain('opacity-20');
    expect(tp.className).not.toContain('opacity-70');
  });

  it('分子セルに強ハイライトが適用される (ring-2 scale-105)', () => {
    const highlight: HighlightGroup = {
      numeratorCells: ['tp'],
      denominatorOnlyCells: ['fp'],
    };
    render(<ConfusionMatrixGrid highlight={highlight} />);
    const tp = screen.getByTestId('matrix-cell-tp');
    expect(tp.className).toContain('ring-2');
    expect(tp.className).toContain('scale-105');
  });

  it('分母のみセルに薄ハイライトが適用される (opacity-70)', () => {
    const highlight: HighlightGroup = {
      numeratorCells: ['tp'],
      denominatorOnlyCells: ['fp'],
    };
    render(<ConfusionMatrixGrid highlight={highlight} />);
    const fp = screen.getByTestId('matrix-cell-fp');
    expect(fp.className).toContain('opacity-70');
  });

  it('無関係セルにフェードアウトが適用される (opacity-20)', () => {
    const highlight: HighlightGroup = {
      numeratorCells: ['tp'],
      denominatorOnlyCells: ['fp'],
    };
    render(<ConfusionMatrixGrid highlight={highlight} />);
    const fn = screen.getByTestId('matrix-cell-fn');
    const tn = screen.getByTestId('matrix-cell-tn');
    expect(fn.className).toContain('opacity-20');
    expect(tn.className).toContain('opacity-20');
  });

  it('各セルに説明文を表示する', () => {
    render(<ConfusionMatrixGrid highlight={null} />);
    expect(screen.getByTestId('matrix-cell-tp')).toHaveTextContent('陽性を正しく陽性と予測');
    expect(screen.getByTestId('matrix-cell-tn')).toHaveTextContent('陰性を正しく陰性と予測');
  });
});
