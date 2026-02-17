import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorCurveSlider } from '../visual-explanations/ErrorCurveSlider';

describe('ErrorCurveSlider', () => {
  const defaultProps = {
    label: 'モデルの複雑さ',
    value: 0.5,
    onChange: vi.fn(),
  };

  it('input[type=range] を描画する', () => {
    render(<ErrorCurveSlider {...defaultProps} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('ラベルを表示する', () => {
    render(<ErrorCurveSlider {...defaultProps} />);
    expect(screen.getByText('モデルの複雑さ')).toBeInTheDocument();
  });

  it('value が反映される', () => {
    render(<ErrorCurveSlider {...defaultProps} value={0.7} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('0.7');
  });

  it('値変更時にonChangeが発火する', () => {
    const onChange = vi.fn();
    render(<ErrorCurveSlider {...defaultProps} onChange={onChange} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '0.8' } });
    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it('min=0, max=1, step=0.01 が設定される', () => {
    render(<ErrorCurveSlider {...defaultProps} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('1');
    expect(slider.step).toBe('0.01');
  });
});
