import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubsectionMap } from '../concept-map/SubsectionMap';
import type { LayoutResult } from '@/types/concept-map';
import type { GlossaryTerm, TermExamPoints } from '@/types/glossary';

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

  const mockExamPoints: TermExamPoints[] = [
    {
      termId: 'a',
      points: ['用語Aの試験ポイント1', '用語Aの試験ポイント2'],
      formula: 'A = B + C',
    },
    {
      termId: 'b',
      points: ['用語Bの試験ポイント1'],
    },
  ];

  it('SVG要素をレンダリングする', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('viewBoxがレイアウトサイズに対応する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toContain('400');
    expect(svg?.getAttribute('viewBox')).toContain('242');
  });

  it('ノード数分のg要素（TermNode）が存在する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const gElements = container.querySelectorAll('g[transform]');
    expect(gElements.length).toBeGreaterThanOrEqual(2);
  });

  it('エッジ数分のpath要素が存在する', () => {
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('ノードクリックでツールチップが表示される', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);
    expect(screen.getByText('用語Aの試験ポイント1')).toBeInTheDocument();
    expect(screen.getByText('用語Aの試験ポイント2')).toBeInTheDocument();
  });

  it('ツールチップに公式が表示される', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);
    expect(screen.getByText('A = B + C')).toBeInTheDocument();
  });

  it('ツールチップの閉じるボタンで非表示になる', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);
    expect(screen.getByText('用語Aの試験ポイント1')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    await user.click(closeBtn);
    expect(screen.queryByText('用語Aの試験ポイント1')).not.toBeInTheDocument();
  });

  it('別のノードクリックでツールチップが切り替わる', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);
    expect(screen.getByText('用語Aの試験ポイント1')).toBeInTheDocument();

    const secondNode = container.querySelector('g[transform="translate(200, 146)"]')!;
    await user.click(secondNode);
    expect(screen.queryByText('用語Aの試験ポイント1')).not.toBeInTheDocument();
    expect(screen.getByText('用語Bの試験ポイント1')).toBeInTheDocument();
  });

  it('同じノードを再クリックでツールチップが閉じる', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);
    expect(screen.getByText('用語Aの試験ポイント1')).toBeInTheDocument();

    await user.click(firstNode);
    expect(screen.queryByText('用語Aの試験ポイント1')).not.toBeInTheDocument();
  });

  it('選択ノードにハイライトが適用される', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SubsectionMap layout={mockLayout} terms={mockTerms} examPoints={mockExamPoints} />,
    );
    const firstNode = container.querySelector('g[transform="translate(0, 0)"]')!;
    await user.click(firstNode);

    const rect = firstNode.querySelector('rect');
    expect(rect?.getAttribute('class')).toContain('stroke-blue-500');
  });
});
