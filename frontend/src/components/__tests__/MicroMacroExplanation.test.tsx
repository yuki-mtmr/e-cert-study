import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MicroMacroExplanation } from '../visual-explanations/MicroMacroExplanation';

describe('MicroMacroExplanation', () => {
  it('セクションを結合して描画する', () => {
    render(<MicroMacroExplanation />);
    expect(screen.getByText('3クラス混同行列')).toBeInTheDocument();
  });

  it('クイズセクションが表示される', () => {
    render(<MicroMacroExplanation />);
    expect(screen.getByTestId('quiz-scenario')).toBeInTheDocument();
  });
});
