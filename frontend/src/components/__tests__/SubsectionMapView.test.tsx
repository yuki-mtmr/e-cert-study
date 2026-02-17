import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubsectionMapView } from '../concept-map/SubsectionMapView';

// 実際のデータ・レイアウトモジュールをモック
vi.mock('@/data/glossary/term-relations', () => ({
  getRelationsForSubsection: vi.fn(() => ({
    subsectionId: 'math-prob',
    relations: [
      { from: 'conditional-prob', to: 'bayes-theorem', type: 'prerequisite' },
    ],
  })),
}));

vi.mock('@/data/glossary/exam-points', () => ({
  getExamPoints: vi.fn((termId: string) => ({
    termId,
    points: [`${termId}の試験ポイント`],
  })),
}));

vi.mock('@/lib/concept-map-layout', () => ({
  computeLayout: vi.fn(() => ({
    nodes: [
      { termId: 'conditional-prob', x: 0, y: 0, level: 0 },
      { termId: 'bayes-theorem', x: 0, y: 146, level: 1 },
    ],
    edges: [
      {
        from: 'conditional-prob',
        to: 'bayes-theorem',
        type: 'prerequisite',
        points: [
          { x: 80, y: 56 },
          { x: 80, y: 101 },
          { x: 80, y: 101 },
          { x: 80, y: 146 },
        ],
      },
    ],
    width: 160,
    height: 202,
  })),
}));

describe('SubsectionMapView', () => {
  const defaultProps = {
    subsectionId: 'math-prob',
    subsectionName: '確率・統計',
    terms: [
      { id: 'conditional-prob', jaName: '条件付き確率', enName: 'Conditional Probability', description: '', sectionId: 'math', subsectionId: 'math-prob' },
      { id: 'bayes-theorem', jaName: 'ベイズの定理', enName: "Bayes' Theorem", description: '', sectionId: 'math', subsectionId: 'math-prob' },
    ],
    onBack: vi.fn(),
  };

  it('戻るボタンを表示する', () => {
    render(<SubsectionMapView {...defaultProps} />);
    expect(screen.getByRole('button', { name: /戻る/ })).toBeInTheDocument();
  });

  it('サブセクション名を表示する', () => {
    render(<SubsectionMapView {...defaultProps} />);
    expect(screen.getByText('確率・統計')).toBeInTheDocument();
  });

  it('戻るボタンクリックでonBackが呼ばれる', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<SubsectionMapView {...defaultProps} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /戻る/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('SVGマップがレンダリングされる', () => {
    const { container } = render(<SubsectionMapView {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('凡例が表示される', () => {
    render(<SubsectionMapView {...defaultProps} />);
    expect(screen.getByText('前提知識')).toBeInTheDocument();
    expect(screen.getByText('派生')).toBeInTheDocument();
    expect(screen.getByText('構成要素')).toBeInTheDocument();
    expect(screen.getByText('適用')).toBeInTheDocument();
  });

  // --- タブ統合テスト ---

  it('ビジュアル解説がないサブセクションではタブが表示されない', () => {
    render(<SubsectionMapView {...defaultProps} subsectionId="math-prob" />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('ビジュアル解説があるサブセクション(ml-issues)でタブが表示される', () => {
    render(<SubsectionMapView {...defaultProps} subsectionId="ml-issues" />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '用語マップ' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ビジュアル解説' })).toBeInTheDocument();
  });

  it('デフォルトでは用語マップタブがアクティブ', () => {
    render(<SubsectionMapView {...defaultProps} subsectionId="ml-issues" />);
    expect(screen.getByRole('tab', { name: '用語マップ' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ビジュアル解説タブに切り替えるとビジュアルが表示される', async () => {
    const user = userEvent.setup();
    render(<SubsectionMapView {...defaultProps} subsectionId="ml-issues" />);

    await user.click(screen.getByRole('tab', { name: 'ビジュアル解説' }));
    expect(screen.getByText('訓練誤差と汎化誤差の関係')).toBeInTheDocument();
  });

  it('ビジュアル解説タブから用語マップに戻れる', async () => {
    const user = userEvent.setup();
    const { container } = render(<SubsectionMapView {...defaultProps} subsectionId="ml-issues" />);

    // ビジュアルタブへ
    await user.click(screen.getByRole('tab', { name: 'ビジュアル解説' }));
    expect(screen.getByText('訓練誤差と汎化誤差の関係')).toBeInTheDocument();

    // 用語マップへ戻る
    await user.click(screen.getByRole('tab', { name: '用語マップ' }));
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('前提知識')).toBeInTheDocument();
  });
});
