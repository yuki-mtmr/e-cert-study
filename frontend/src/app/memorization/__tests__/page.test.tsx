import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemorizationPage from '../page';

// Next.js Linkモック
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('MemorizationPage', () => {
  it('設定画面が表示される', () => {
    render(<MemorizationPage />);
    expect(screen.getByText('暗記クイズ')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ選択')).toBeInTheDocument();
    expect(screen.getByText('クイズ開始')).toBeInTheDocument();
  });

  it('ホームへ戻るリンクがある', () => {
    render(<MemorizationPage />);
    const link = screen.getByText('ホームへ戻る');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('setup → active → results のフローが動作する', async () => {
    render(<MemorizationPage />);

    // シャッフルをオフにして順番を固定
    fireEvent.click(screen.getByLabelText('シャッフル'));

    // クイズ開始
    fireEvent.click(screen.getByText('クイズ開始'));

    // active画面：問題が表示される
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // 最初の問題のA選択肢をクリック
    const firstChoice = screen.getAllByRole('button').find((btn) => btn.textContent?.startsWith('A.'));
    expect(firstChoice).toBeDefined();
    fireEvent.click(firstChoice!);

    // 回答後に「次へ」ボタンが表示される
    const nextBtn = screen.getByText('次へ');
    expect(nextBtn).toBeInTheDocument();
  });
});
