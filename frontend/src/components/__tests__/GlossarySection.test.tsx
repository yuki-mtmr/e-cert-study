import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlossarySection } from '../GlossarySection';
import type { GroupedTerms } from '@/types/glossary';

const group: GroupedTerms = {
  section: { id: 'math', name: '応用数学', emoji: '📐' },
  subsections: [
    {
      subsection: { id: 'math-prob', name: '確率・統計', sectionId: 'math' },
      terms: [
        {
          id: 'bayes',
          jaName: 'ベイズの定理',
          enName: "Bayes' Theorem",
          description: '事後確率を求める定理。',
          sectionId: 'math',
          subsectionId: 'math-prob',
        },
      ],
    },
    {
      subsection: { id: 'math-info', name: '情報理論', sectionId: 'math' },
      terms: [
        {
          id: 'entropy',
          jaName: 'エントロピー',
          enName: 'Entropy',
          description: '不確実性の指標。',
          sectionId: 'math',
          subsectionId: 'math-info',
        },
      ],
    },
  ],
  termCount: 2,
};

describe('GlossarySection', () => {
  it('セクション名と絵文字を表示する', () => {
    render(<GlossarySection group={group} defaultOpen={false} />);
    expect(screen.getByText(/📐/)).toBeInTheDocument();
    expect(screen.getByText(/応用数学/)).toBeInTheDocument();
  });

  it('用語数を表示する', () => {
    render(<GlossarySection group={group} defaultOpen={false} />);
    expect(screen.getByText(/2用語/)).toBeInTheDocument();
  });

  it('デフォルト閉じの場合、用語が非表示', () => {
    render(<GlossarySection group={group} defaultOpen={false} />);
    expect(screen.queryByText('ベイズの定理')).not.toBeInTheDocument();
  });

  it('デフォルト開きの場合、用語が表示される', () => {
    render(<GlossarySection group={group} defaultOpen={true} />);
    expect(screen.getByText('ベイズの定理')).toBeInTheDocument();
    expect(screen.getByText('エントロピー')).toBeInTheDocument();
  });

  it('クリックで開閉する', async () => {
    const user = userEvent.setup();
    render(<GlossarySection group={group} defaultOpen={false} />);

    expect(screen.queryByText('ベイズの定理')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('ベイズの定理')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('ベイズの定理')).not.toBeInTheDocument();
  });

  it('サブセクション見出しを表示する', () => {
    render(<GlossarySection group={group} defaultOpen={true} />);
    expect(screen.getByText('確率・統計')).toBeInTheDocument();
    expect(screen.getByText('情報理論')).toBeInTheDocument();
  });
});
