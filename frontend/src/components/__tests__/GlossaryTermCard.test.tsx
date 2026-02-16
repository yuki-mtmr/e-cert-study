import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlossaryTermCard } from '../GlossaryTermCard';
import type { GlossaryTerm } from '@/types/glossary';

const term: GlossaryTerm = {
  id: 'bayes',
  jaName: 'ベイズの定理',
  enName: "Bayes' Theorem",
  description: '条件付き確率を逆転させて事後確率を求める定理。',
  sectionId: 'math',
  subsectionId: 'math-prob',
};

describe('GlossaryTermCard', () => {
  it('日本語名を表示する', () => {
    render(<GlossaryTermCard term={term} />);
    expect(screen.getByText('ベイズの定理')).toBeInTheDocument();
  });

  it('英語名を表示する', () => {
    render(<GlossaryTermCard term={term} />);
    expect(screen.getByText("Bayes' Theorem")).toBeInTheDocument();
  });

  it('説明を表示する', () => {
    render(<GlossaryTermCard term={term} />);
    expect(screen.getByText('条件付き確率を逆転させて事後確率を求める定理。')).toBeInTheDocument();
  });
});
