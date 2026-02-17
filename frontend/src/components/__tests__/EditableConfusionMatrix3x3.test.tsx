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

  it('クラスラベルに「犬」「猫」「鳥」を表示する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('犬').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('猫').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('鳥').length).toBeGreaterThanOrEqual(1);
  });

  it('混同行列の説明テキストを表示する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/行が実際のクラス/)).toBeInTheDocument();
  });

  it('行合計・列合計を表示する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('合計').length).toBeGreaterThanOrEqual(1);
  });

  it('対角セルに「正解」ラベルを表示する', () => {
    render(
      <EditableConfusionMatrix3x3
        matrix={defaultMatrix}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText('正解').length).toBe(3);
  });
});
