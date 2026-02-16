import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubsectionNav } from '../concept-map/SubsectionNav';

describe('SubsectionNav', () => {
  const mockSubsections = [
    { id: 'math-prob', name: '確率・統計', sectionId: 'math' },
    { id: 'math-info', name: '情報理論', sectionId: 'math' },
    { id: 'math-linalg', name: '線形代数', sectionId: 'math' },
  ];

  const mockTermCounts: Record<string, number> = {
    'math-prob': 12,
    'math-info': 8,
    'math-linalg': 10,
  };

  it('サブセクション名を表示する', () => {
    render(
      <SubsectionNav
        subsections={mockSubsections}
        termCounts={mockTermCounts}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('確率・統計')).toBeInTheDocument();
    expect(screen.getByText('情報理論')).toBeInTheDocument();
    expect(screen.getByText('線形代数')).toBeInTheDocument();
  });

  it('用語数を表示する', () => {
    render(
      <SubsectionNav
        subsections={mockSubsections}
        termCounts={mockTermCounts}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('12用語')).toBeInTheDocument();
    expect(screen.getByText('8用語')).toBeInTheDocument();
  });

  it('カードクリックでonSelectが呼ばれる', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SubsectionNav
        subsections={mockSubsections}
        termCounts={mockTermCounts}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('確率・統計'));
    expect(onSelect).toHaveBeenCalledWith('math-prob');
  });
});
