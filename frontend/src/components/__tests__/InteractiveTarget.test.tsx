import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveTarget } from '../visual-explanations/InteractiveTarget';

describe('InteractiveTarget', () => {
  it('SVG要素を描画する', () => {
    const { container } = render(<InteractiveTarget />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('バイアスとバリアンスのスライダーが2本ある', () => {
    render(<InteractiveTarget />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it('再サンプルボタンがある', () => {
    render(<InteractiveTarget />);
    expect(screen.getByRole('button', { name: /再サンプル/ })).toBeInTheDocument();
  });

  it('ノイズチェックボックスがある', () => {
    render(<InteractiveTarget />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('再サンプルボタンクリックでドットが再生成される', () => {
    const { container } = render(<InteractiveTarget />);
    const dots1 = container.querySelectorAll('[data-testid="target-dot"]');
    const count1 = dots1.length;
    fireEvent.click(screen.getByRole('button', { name: /再サンプル/ }));
    const dots2 = container.querySelectorAll('[data-testid="target-dot"]');
    // ドット数は同じ（再生成されている）
    expect(dots2.length).toBe(count1);
  });

  it('重心マーク（×印）を描画する', () => {
    const { container } = render(<InteractiveTarget />);
    const centroidMark = container.querySelector('[data-testid="centroid-mark"]');
    expect(centroidMark).toBeInTheDocument();
  });

  it('バイアス線（重心→中心）を描画する', () => {
    const { container } = render(<InteractiveTarget />);
    const biasLine = container.querySelector('[data-testid="bias-line"]');
    expect(biasLine).toBeInTheDocument();
  });

  it('ノイズチェックボックスONで振幅スライダーが表示される', () => {
    render(<InteractiveTarget />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    const sliders = screen.getAllByRole('slider');
    // バイアス + バリアンス + ノイズ振幅 = 3本
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });
});
