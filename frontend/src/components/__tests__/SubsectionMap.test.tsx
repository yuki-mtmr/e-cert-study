import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SubsectionMap } from '../concept-map/SubsectionMap';
import type { LayoutResult } from '@/types/concept-map';
import type { GlossaryTerm } from '@/types/glossary';

describe('SubsectionMap', () => {
  const mockTerms: GlossaryTerm[] = [
    { id: 'a', jaName: '用語A', enName: 'Term A', description: '', sectionId: 's', subsectionId: 'ss' },
    { id: 'b', jaName: '用語B', enName: 'Term B', description: '', sectionId: 's', subsectionId: 'ss' },
  ];

  const mockLayout: LayoutResult = {
    nodes: [
      { termId: 'a', x: 0, y: 0, level: 0 },
      { termId: 'b', x: 200, y: 146, level: 1 },
    ],
    edges: [
      {
        from: 'a',
        to: 'b',
        type: 'prerequisite',
        points: [
          { x: 80, y: 56 },
          { x: 80, y: 101 },
          { x: 280, y: 101 },
          { x: 280, y: 146 },
        ],
      },
    ],
    width: 360,
    height: 202,
  };

  it('SVG要素をレンダリングする', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('viewBoxがレイアウトサイズに対応する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} />,
    );
    const svg = container.querySelector('svg');
    // viewBox includes padding: -20 -20 (width+40) (height+40)
    expect(svg?.getAttribute('viewBox')).toContain('400');
    expect(svg?.getAttribute('viewBox')).toContain('242');
  });

  it('ノード数分のg要素（TermNode）が存在する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} />,
    );
    // Each TermNode renders a <g> with transform
    const gElements = container.querySelectorAll('g[transform]');
    expect(gElements.length).toBeGreaterThanOrEqual(2);
  });

  it('エッジ数分のpath要素が存在する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });
});
