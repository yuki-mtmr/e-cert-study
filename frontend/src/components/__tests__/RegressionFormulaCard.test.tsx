import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegressionFormulaCard } from '../visual-explanations/RegressionFormulaCard';
import { getRegressionMetrics } from '@/lib/visual-explanations/regression-metrics';

const metrics = getRegressionMetrics();

describe('RegressionFormulaCard', () => {
  it('数式テキストを常に表示する', () => {
    const metric = metrics[0]; // MAE
    render(
      <RegressionFormulaCard metric={metric} isRevealed={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText(/\|y/)).toBeInTheDocument();
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
      const { unmount } = render(
        <RegressionFormulaCard metric={metric} isRevealed={true} onToggle={vi.fn()} />,
      );
      expect(screen.getByText(metric.name)).toBeInTheDocument();
      unmount();
    }
  });

  it('R²カードでspecialForm表示ができる', () => {
    const r2 = metrics.find((m) => m.id === 'r-squared')!;
    render(
      <RegressionFormulaCard metric={r2} isRevealed={false} onToggle={vi.fn()} />,
    );
    expect(screen.getByText(/SS_res/)).toBeInTheDocument();
  });
});
