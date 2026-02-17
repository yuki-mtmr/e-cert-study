import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// KaTeXをモック
vi.mock('katex', () => ({
  default: {
    renderToString: (formula: string) =>
      `<span class="katex">${formula}</span>`,
  },
}));

import { RegressionFormulaCard } from '../visual-explanations/RegressionFormulaCard';
import { getRegressionMetrics } from '@/lib/visual-explanations/regression-metrics';

const metrics = getRegressionMetrics();

describe('RegressionFormulaCard', () => {
  it('KaTeX出力（.katex要素）を描画する', () => {
    const metric = metrics[0]; // MAE
    const { container } = render(
      <RegressionFormulaCard metric={metric} isRevealed={false} onToggle={vi.fn()} />,
    );
    const katexEl = container.querySelector('.katex');
    expect(katexEl).toBeInTheDocument();
  });

  it('KaTeX出力にLaTeX文字列が含まれる', () => {
    const metric = metrics[0]; // MAE
    const { container } = render(
      <RegressionFormulaCard metric={metric} isRevealed={false} onToggle={vi.fn()} />,
    );
    const katexEl = container.querySelector('.katex');
    expect(katexEl?.textContent).toContain('\\frac');
  });

  it('非公開時は指標名を表示しない', () => {
    const metric = metrics[0]; // MAE
    render(
      <RegressionFormulaCard metric={metric} isRevealed={false} onToggle={vi.fn()} />,
    );
    expect(screen.queryByText('平均絶対誤差')).not.toBeInTheDocument();
  });

  it('公開時に指標名・英語名・説明・覚え方を表示する', () => {
    const metric = metrics[0]; // MAE
    render(
      <RegressionFormulaCard metric={metric} isRevealed={true} onToggle={vi.fn()} />,
    );
    expect(screen.getByText('平均絶対誤差')).toBeInTheDocument();
    expect(screen.getByText('Mean Absolute Error')).toBeInTheDocument();
    expect(screen.getByText(metric.description)).toBeInTheDocument();
    expect(screen.getByText(metric.tip)).toBeInTheDocument();
  });

  it('クリックでonToggleが呼ばれる', () => {
    const metric = metrics[0];
    const onToggle = vi.fn();
    render(
      <RegressionFormulaCard metric={metric} isRevealed={false} onToggle={onToggle} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('4つの指標すべてでレンダリングできる', () => {
    for (const metric of metrics) {
      const { unmount, container } = render(
        <RegressionFormulaCard metric={metric} isRevealed={true} onToggle={vi.fn()} />,
      );
      expect(screen.getByText(metric.name)).toBeInTheDocument();
      expect(container.querySelector('.katex')).toBeInTheDocument();
      unmount();
    }
  });

  it('R²カードでもKaTeX出力が描画される', () => {
    const r2 = metrics.find((m) => m.id === 'r-squared')!;
    const { container } = render(
      <RegressionFormulaCard metric={r2} isRevealed={false} onToggle={vi.fn()} />,
    );
    const katexEl = container.querySelector('.katex');
    expect(katexEl).toBeInTheDocument();
    expect(katexEl?.textContent).toContain('SS_{res}');
  });
});
