import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FullscreenButton } from '../FullscreenButton';

const mockToggleFullscreen = vi.fn();
let mockIsFullscreen = false;

vi.mock('@/hooks/useFullscreen', () => ({
  useFullscreen: vi.fn(() => ({
    isFullscreen: mockIsFullscreen,
    toggleFullscreen: mockToggleFullscreen,
  })),
}));

describe('FullscreenButton', () => {
  beforeEach(() => {
    mockIsFullscreen = false;
    mockToggleFullscreen.mockClear();
  });

  it('ボタンがレンダリングされること', () => {
    render(<FullscreenButton />);
    expect(screen.getByRole('button', { name: /全画面表示/i })).toBeInTheDocument();
  });

  it('全画面でない時「全画面表示」ラベルが表示されること', () => {
    render(<FullscreenButton />);
    expect(screen.getByLabelText('全画面表示')).toBeInTheDocument();
  });

  it('クリックで toggleFullscreen が呼ばれること', async () => {
    const user = userEvent.setup();
    render(<FullscreenButton />);

    await user.click(screen.getByRole('button', { name: /全画面表示/i }));

    expect(mockToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('全画面時に「全画面を解除」ラベルが表示されること', () => {
    mockIsFullscreen = true;
    render(<FullscreenButton />);
    expect(screen.getByLabelText('全画面を解除')).toBeInTheDocument();
  });
});
