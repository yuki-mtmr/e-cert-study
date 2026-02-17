import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IdentificationFlowchart } from '../visual-explanations/IdentificationFlowchart';

describe('IdentificationFlowchart', () => {
  it('初期ステップの質問を表示する', () => {
    render(<IdentificationFlowchart />);
    expect(screen.getByText(/二重積分/)).toBeInTheDocument();
  });

  it('「はい」ボタンと「いいえ」ボタンがある', () => {
    render(<IdentificationFlowchart />);
    expect(screen.getByRole('button', { name: /はい/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /いいえ/ })).toBeInTheDocument();
  });

  it('最初に「はい」クリックでNoise確定', () => {
    render(<IdentificationFlowchart />);
    fireEvent.click(screen.getByRole('button', { name: /はい/ }));
    expect(screen.getByText(/Noise/)).toBeInTheDocument();
  });

  it('最初に「いいえ」→次の質問を表示', () => {
    render(<IdentificationFlowchart />);
    fireEvent.click(screen.getByRole('button', { name: /いいえ/ }));
    expect(screen.getByText(/E_D\[y\].*h\(x\)/)).toBeInTheDocument();
  });

  it('「いいえ」→「はい」でBias²確定', () => {
    render(<IdentificationFlowchart />);
    fireEvent.click(screen.getByRole('button', { name: /いいえ/ }));
    fireEvent.click(screen.getByRole('button', { name: /はい/ }));
    expect(screen.getByText(/Bias/)).toBeInTheDocument();
  });

  it('「いいえ」→「いいえ」でVariance確定', () => {
    render(<IdentificationFlowchart />);
    fireEvent.click(screen.getByRole('button', { name: /いいえ/ }));
    fireEvent.click(screen.getByRole('button', { name: /いいえ/ }));
    expect(screen.getByText(/Variance/)).toBeInTheDocument();
  });

  it('リセットボタンで最初に戻る', () => {
    render(<IdentificationFlowchart />);
    fireEvent.click(screen.getByRole('button', { name: /はい/ }));
    fireEvent.click(screen.getByRole('button', { name: /リセット/ }));
    expect(screen.getByText(/二重積分/)).toBeInTheDocument();
  });
});
