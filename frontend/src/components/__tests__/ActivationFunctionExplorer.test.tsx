import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivationFunctionExplorer } from '../visual-explanations/ActivationFunctionExplorer';

describe('ActivationFunctionExplorer', () => {
  it('SVGグラフを描画する', () => {
    render(<ActivationFunctionExplorer />);
    const svg = screen.getByRole('img', { name: '活性化関数グラフ' });
    expect(svg).toBeInTheDocument();
  });

  it('sigmoid/tanh/ReLU/Leaky ReLU切替ボタンを表示する', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.getByRole('button', { name: 'Sigmoid' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tanh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ReLU' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leaky ReLU' })).toBeInTheDocument();
  });

  it('デフォルトでsigmoidが選択状態', () => {
    render(<ActivationFunctionExplorer />);
    const btn = screen.getByRole('button', { name: 'Sigmoid' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('tanh切替でaria-pressedが切り替わる', () => {
    render(<ActivationFunctionExplorer />);
    const tanhBtn = screen.getByRole('button', { name: 'tanh' });
    fireEvent.click(tanhBtn);
    expect(tanhBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sigmoid' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('zスライダーを表示する', () => {
    render(<ActivationFunctionExplorer />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it('f(z)とf\'(z)の値を表示する', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.getByTestId('value-fz')).toBeInTheDocument();
    expect(screen.getByTestId('value-dfz')).toBeInTheDocument();
  });

  it('勾配状態ラベルを表示する', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.getByTestId('gradient-status')).toBeInTheDocument();
  });

  it('sigmoid(0) でf(z)=0.500を表示する', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.getByTestId('value-fz').textContent).toContain('0.500');
  });

  it('スライダー操作でf(z)値が変化する', () => {
    render(<ActivationFunctionExplorer />);
    const initial = screen.getByTestId('value-fz').textContent;
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '3' } });
    const updated = screen.getByTestId('value-fz').textContent;
    expect(updated).not.toBe(initial);
  });

  it('clipPath定義が存在する', () => {
    const { container } = render(<ActivationFunctionExplorer />);
    const clipPath = container.querySelector('clipPath#activation-plot-clip');
    expect(clipPath).not.toBeNull();
  });

  it('関数曲線のpath要素を描画する', () => {
    const { container } = render(<ActivationFunctionExplorer />);
    const paths = container.querySelectorAll('path.activation-curve');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('導関数曲線のpath要素を描画する', () => {
    const { container } = render(<ActivationFunctionExplorer />);
    const paths = container.querySelectorAll('path.derivative-curve');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('数式カードにE資格ポイントを表示する', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.getByTestId('key-point')).toBeInTheDocument();
  });

  it('Leaky ReLU切替でaria-pressedが切り替わる', () => {
    render(<ActivationFunctionExplorer />);
    const leakyBtn = screen.getByRole('button', { name: 'Leaky ReLU' });
    fireEvent.click(leakyBtn);
    expect(leakyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sigmoid' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('Leaky ReLU選択時にαスライダーが表示される', () => {
    render(<ActivationFunctionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: 'Leaky ReLU' }));
    expect(screen.getByText(/α =/)).toBeInTheDocument();
  });

  it('sigmoid選択時にαスライダーが表示されない', () => {
    render(<ActivationFunctionExplorer />);
    expect(screen.queryByText(/α =/)).not.toBeInTheDocument();
  });
});
