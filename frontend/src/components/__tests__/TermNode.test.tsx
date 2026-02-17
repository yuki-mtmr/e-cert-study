import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TermNode } from '../concept-map/TermNode';

describe('TermNode', () => {
  const defaultProps = {
    termId: 'test-term',
    jaName: 'テスト用語',
    enName: 'Test Term',
    x: 100,
    y: 50,
  };

  it('SVG rect要素をレンダリングする', () => {
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} />
      </svg>,
    );
    const rect = container.querySelector('rect');
    expect(rect).toBeInTheDocument();
  });

  it('日本語名と英語名のテキストを表示する', () => {
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} />
      </svg>,
    );
    const texts = container.querySelectorAll('text');
    const textContent = Array.from(texts).map((t) => t.textContent);
    expect(textContent).toContain('テスト用語');
    expect(textContent).toContain('Test Term');
  });

  it('指定位置にtransformが設定される', () => {
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} />
      </svg>,
    );
    const g = container.querySelector('g');
    expect(g).toHaveAttribute('transform', 'translate(100, 50)');
  });

  it('クリック時にonClickを呼ぶ', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} onClick={onClick} />
      </svg>,
    );
    const g = container.querySelector('g')!;
    await user.click(g);
    expect(onClick).toHaveBeenCalledWith('test-term');
  });

  it('selected=trueのときハイライトスタイルが適用される', () => {
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} selected />
      </svg>,
    );
    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('class')).toContain('stroke-blue-500');
  });

  it('selected=falseのときデフォルトスタイルが適用される', () => {
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} selected={false} />
      </svg>,
    );
    const rect = container.querySelector('rect');
    expect(rect?.getAttribute('class')).toContain('stroke-gray-300');
  });

  it('onClickが未指定でもクリックでエラーにならない', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <svg>
        <TermNode {...defaultProps} />
      </svg>,
    );
    const g = container.querySelector('g')!;
    await user.click(g);
    // エラーが発生しないことを確認
  });
});
