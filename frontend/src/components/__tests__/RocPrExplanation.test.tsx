import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RocPrExplanation } from '../visual-explanations/RocPrExplanation';

describe('RocPrExplanation', () => {
  it('4つのセクションを結合して描画する', () => {
    render(<RocPrExplanation />);
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2);
  });

  it('セクション見出しが表示される', () => {
    render(<RocPrExplanation />);
    expect(screen.getByText('ROC曲線とAUC')).toBeInTheDocument();
    expect(screen.getByText('モデル比較')).toBeInTheDocument();
  });
});
