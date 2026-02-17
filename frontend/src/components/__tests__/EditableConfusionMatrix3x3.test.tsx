import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditableConfusionMatrix3x3 } from '../visual-explanations/EditableConfusionMatrix3x3';

describe('EditableConfusionMatrix3x3', () => {
  const defaultMatrix = [
    [50, 5, 5],
    [5, 50, 5],
    [5, 5, 50],
  ];

  it('9つの入力フィールドを描画する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(9);
  });

  it('混同行列の値が入力フィールドに表示される', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('50');
    expect(inputs[1].value).toBe('5');
  });

  it('値を変更するとonChangeが発火する', () => {
    const onChange = vi.fn();
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={onChange}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('クラスラベルを表示する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/クラス/).length).toBeGreaterThanOrEqual(3);
  });
});
