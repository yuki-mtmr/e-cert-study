import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RelationEdge } from '../concept-map/RelationEdge';

describe('RelationEdge', () => {
  const defaultProps = {
    from: 'a',
    to: 'b',
    type: 'prerequisite' as const,
    points: [
      { x: 100, y: 56 },
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 146 },
    ],
  };

  it('SVG path要素をレンダリングする', () => {
    const { container } = render(
      <svg>
        <defs />
        <RelationEdge {...defaultProps} />
      </svg>,
    );
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
  });

  it('関係種別に応じた色が適用される', () => {
    const { container: c1 } = render(
      <svg><RelationEdge {...defaultProps} type="prerequisite" /></svg>,
    );
    expect(c1.querySelector('path')?.getAttribute('stroke')).toBe('#94a3b8');

    const { container: c2 } = render(
      <svg><RelationEdge {...defaultProps} type="variant" /></svg>,
    );
    expect(c2.querySelector('path')?.getAttribute('stroke')).toBe('#3b82f6');

    const { container: c3 } = render(
      <svg><RelationEdge {...defaultProps} type="component" /></svg>,
    );
    expect(c3.querySelector('path')?.getAttribute('stroke')).toBe('#22c55e');

    const { container: c4 } = render(
      <svg><RelationEdge {...defaultProps} type="applies" /></svg>,
    );
    expect(c4.querySelector('path')?.getAttribute('stroke')).toBe('#f59e0b');
  });

  it('ラベルが指定されている場合テキストを表示する', () => {
    const { container } = render(
      <svg>
        <RelationEdge {...defaultProps} label="改良" />
      </svg>,
    );
    const text = container.querySelector('text');
    expect(text).toBeInTheDocument();
    expect(text?.textContent).toBe('改良');
  });

  it('ラベルなしの場合テキスト要素が表示されない', () => {
    const { container } = render(
      <svg>
        <RelationEdge {...defaultProps} />
      </svg>,
    );
    const text = container.querySelector('text');
    expect(text).not.toBeInTheDocument();
  });
});
