import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptMapView } from '../ConceptMapView';

describe('ConceptMapView', () => {
  it('セクション未選択時にoverviewマップを表示する', () => {
    render(<ConceptMapView />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/concept-maps/overview.svg');
  });

  it('タイトルと説明文を表示する', () => {
    render(<ConceptMapView />);
    expect(screen.getByText('E資格 全体マップ')).toBeInTheDocument();
    expect(screen.getByText('5分野の関係性と学習順序')).toBeInTheDocument();
  });

  it('セクションID指定時にそのセクションのマップを表示する', () => {
    render(<ConceptMapView selectedSectionId="ml" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/concept-maps/ml.svg');
    expect(screen.getByText('機械学習')).toBeInTheDocument();
  });

  it('SVG画像にダークモード用のCSSクラスが適用される', () => {
    render(<ConceptMapView />);
    const img = screen.getByRole('img');
    expect(img.className).toContain('dark:invert');
    expect(img.className).toContain('dark:hue-rotate-180');
  });

  it('画像クリックでモーダルが開く', async () => {
    const user = userEvent.setup();
    render(<ConceptMapView />);

    const img = screen.getByRole('img');
    await user.click(img);

    expect(screen.getByTestId('concept-map-modal')).toBeInTheDocument();
  });

  it('モーダルの閉じるボタンでモーダルが閉じる', async () => {
    const user = userEvent.setup();
    render(<ConceptMapView />);

    await user.click(screen.getByRole('img'));
    expect(screen.getByTestId('concept-map-modal')).toBeInTheDocument();

    await user.click(screen.getByLabelText('close'));
    expect(screen.queryByTestId('concept-map-modal')).not.toBeInTheDocument();
  });

  it('Escapeキーでモーダルが閉じる', async () => {
    const user = userEvent.setup();
    render(<ConceptMapView />);

    await user.click(screen.getByRole('img'));
    expect(screen.getByTestId('concept-map-modal')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('concept-map-modal')).not.toBeInTheDocument();
  });

  it('セクション切替時にマップが変わる', () => {
    const { rerender } = render(<ConceptMapView selectedSectionId="math" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/concept-maps/math.svg');

    rerender(<ConceptMapView selectedSectionId="devops" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/concept-maps/devops.svg');
  });

  it('セクション選択時にサブセクションカード一覧が表示される', () => {
    render(<ConceptMapView selectedSectionId="math" />);
    expect(screen.getByText('確率・統計')).toBeInTheDocument();
    expect(screen.getByText('情報理論')).toBeInTheDocument();
    expect(screen.getByText('線形代数')).toBeInTheDocument();
  });

  it('セクション未選択時はサブセクションカードが表示されない', () => {
    render(<ConceptMapView />);
    expect(screen.queryByText('確率・統計')).not.toBeInTheDocument();
  });

  it('サブセクションカードクリックで用語関係マップに遷移する', async () => {
    const user = userEvent.setup();
    render(<ConceptMapView selectedSectionId="math" />);

    await user.click(screen.getByText('確率・統計'));

    // ドリルダウン後: 戻るボタンとSVGマップが表示される
    expect(screen.getByRole('button', { name: /戻る/ })).toBeInTheDocument();
    expect(screen.getByText('確率・統計')).toBeInTheDocument();
    // セクションSVG画像は非表示
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('戻るボタンでセクションビューに戻る', async () => {
    const user = userEvent.setup();
    render(<ConceptMapView selectedSectionId="math" />);

    await user.click(screen.getByText('確率・統計'));
    expect(screen.getByRole('button', { name: /戻る/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /戻る/ }));
    // セクションSVG画像が再表示
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('セクションフィルタ変更時にサブセクション選択がリセットされる', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ConceptMapView selectedSectionId="math" />);

    await user.click(screen.getByText('確率・統計'));
    expect(screen.getByRole('button', { name: /戻る/ })).toBeInTheDocument();

    rerender(<ConceptMapView selectedSectionId="ml" />);
    // ドリルダウンがリセットされ、セクションビューに戻る
    expect(screen.queryByRole('button', { name: /戻る/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
