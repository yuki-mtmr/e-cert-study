import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TermTooltip } from '../concept-map/TermTooltip';
import type { TermExamPoints } from '@/types/glossary';

describe('TermTooltip', () => {
  const examPoints: TermExamPoints = {
    termId: 'bayes-theorem',
    points: [
      '事後確率の公式を正確に書けるようにする。',
      'ナイーブベイズ分類器の理論的基盤。',
    ],
    formula: 'P(θ|D) = P(D|θ)P(θ) / P(D)',
  };

  const defaultProps = {
    jaName: 'ベイズの定理',
    examPoints,
    x: 100,
    y: 200,
  };

  it('試験ポイントの各項目を表示する', () => {
    render(<TermTooltip {...defaultProps} />);
    expect(screen.getByText('事後確率の公式を正確に書けるようにする。')).toBeInTheDocument();
    expect(screen.getByText('ナイーブベイズ分類器の理論的基盤。')).toBeInTheDocument();
  });

  it('公式を表示する', () => {
    render(<TermTooltip {...defaultProps} />);
    expect(screen.getByText('P(θ|D) = P(D|θ)P(θ) / P(D)')).toBeInTheDocument();
  });

  it('用語名をヘッダーとして表示する', () => {
    render(<TermTooltip {...defaultProps} />);
    expect(screen.getByText('ベイズの定理')).toBeInTheDocument();
  });

  it('formulaがない場合は公式セクションを表示しない', () => {
    const noFormulaPoints: TermExamPoints = {
      termId: 'pca',
      points: ['PCAの手順を理解する。'],
    };
    render(
      <TermTooltip jaName="主成分分析" examPoints={noFormulaPoints} x={0} y={0} />,
    );
    expect(screen.queryByTestId('tooltip-formula')).not.toBeInTheDocument();
  });

  it('位置がstyleとして反映される', () => {
    const { container } = render(<TermTooltip {...defaultProps} />);
    const tooltip = container.firstElementChild as HTMLElement;
    expect(tooltip.style.left).toBe('100px');
    expect(tooltip.style.top).toBe('200px');
  });

  it('閉じるボタンがクリックできる', async () => {
    const { user } = await import('@testing-library/user-event').then(m => ({
      user: m.default.setup(),
    }));
    const onClose = vi.fn();
    render(<TermTooltip {...defaultProps} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
