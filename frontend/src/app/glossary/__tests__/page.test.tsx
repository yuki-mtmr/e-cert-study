import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryPage from '../page';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('GlossaryPage', () => {
  it('タイトルを表示する', () => {
    render(<GlossaryPage />);
    expect(screen.getByText('E資格 用語集')).toBeInTheDocument();
  });

  it('検索欄がある', () => {
    render(<GlossaryPage />);
    expect(screen.getByPlaceholderText('用語を検索...')).toBeInTheDocument();
  });

  it('セクションフィルタボタンがある', () => {
    render(<GlossaryPage />);
    expect(screen.getByText('全て')).toBeInTheDocument();
    // フィルタボタンとアコーディオンヘッダーの両方にセクション名があるのでgetAllを使用
    expect(screen.getAllByText(/応用数学/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/機械学習/).length).toBeGreaterThanOrEqual(2);
  });

  it('用語数を表示する', () => {
    render(<GlossaryPage />);
    expect(screen.getByText(/全 \d+ 用語/)).toBeInTheDocument();
  });

  it('5つのセクション（アコーディオン）が表示される', () => {
    render(<GlossaryPage />);
    expect(screen.getAllByText(/応用数学/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/深層学習の基礎/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/深層学習の応用/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/開発・運用環境/).length).toBeGreaterThanOrEqual(1);
  });

  it('検索でフィルタされる', () => {
    render(<GlossaryPage />);

    const input = screen.getByPlaceholderText('用語を検索...');
    fireEvent.change(input, { target: { value: 'ベイズの定理' } });

    // マッチする用語のセクションが自動展開される
    expect(screen.getByText('ベイズの定理')).toBeInTheDocument();
  });

  it('セクションボタンでフィルタされる', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);

    // フィルタボタン（ピル）は丸型ボタンで、アコーディオンは角型
    // getAllByRoleで全ボタンを取得し、テキスト内容でフィルタ
    const allButtons = screen.getAllByRole('button');
    const devopsFilterBtn = allButtons.find(
      (btn) => btn.textContent?.includes('開発・運用環境') && btn.classList.contains('rounded-full')
    );
    expect(devopsFilterBtn).toBeDefined();
    await user.click(devopsFilterBtn!);

    // フィルタ後は開発・運用環境以外のアコーディオンが消える
    // 応用数学はフィルタボタンのみに残り、アコーディオンは消える
    const mathElements = screen.getAllByText(/応用数学/);
    expect(mathElements).toHaveLength(1); // フィルタボタンのみ
  });

  it('ホームへのリンクがある', () => {
    render(<GlossaryPage />);
    const homeLink = screen.getByText('← ホーム');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  // マップビュー関連テスト
  it('ViewToggleが表示される', () => {
    render(<GlossaryPage />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /リスト/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /マップ/ })).toBeInTheDocument();
  });

  it('デフォルトはリストビュー', () => {
    render(<GlossaryPage />);
    expect(screen.getByRole('tab', { name: /リスト/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('マップタブをクリックするとマップビューに切り替わる', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);

    await user.click(screen.getByRole('tab', { name: /マップ/ }));

    // マップビューではコンセプトマップのタイトルが表示される
    expect(screen.getByText('E資格 全体マップ')).toBeInTheDocument();
    // SVGイメージが表示される
    expect(screen.getByRole('img')).toHaveAttribute('src', '/concept-maps/overview.svg');
  });

  it('マップビューでセクション選択するとそのセクションのマップが表示される', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);

    // マップビューに切替
    await user.click(screen.getByRole('tab', { name: /マップ/ }));

    // セクションフィルタで機械学習を選択
    const allButtons = screen.getAllByRole('button');
    const mlFilterBtn = allButtons.find(
      (btn) => btn.textContent?.includes('機械学習') && btn.classList.contains('rounded-full')
    );
    expect(mlFilterBtn).toBeDefined();
    await user.click(mlFilterBtn!);

    expect(screen.getByRole('img')).toHaveAttribute('src', '/concept-maps/ml.svg');
  });

  it('リストビューに戻るとセクション一覧が表示される', async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);

    // マップビューに切替
    await user.click(screen.getByRole('tab', { name: /マップ/ }));
    // リストビューに戻す
    await user.click(screen.getByRole('tab', { name: /リスト/ }));

    // セクションアコーディオンが再度表示される
    expect(screen.getAllByText(/応用数学/).length).toBeGreaterThanOrEqual(2);
  });
});
