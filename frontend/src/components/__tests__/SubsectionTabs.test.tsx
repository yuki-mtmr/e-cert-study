import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubsectionTabs } from '../visual-explanations/SubsectionTabs';

describe('SubsectionTabs', () => {
  const defaultProps = {
    activeTab: 'map' as const,
    onTabChange: vi.fn(),
  };

  it('用語マップとビジュアル解説の2つのタブを描画する', () => {
    render(<SubsectionTabs {...defaultProps} />);
    expect(screen.getByRole('tab', { name: '用語マップ' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ビジュアル解説' })).toBeInTheDocument();
  });

  it('activeTab=map のとき用語マップタブがアクティブ', () => {
    render(<SubsectionTabs {...defaultProps} activeTab="map" />);
    const mapTab = screen.getByRole('tab', { name: '用語マップ' });
    expect(mapTab).toHaveAttribute('aria-selected', 'true');
  });

  it('activeTab=visual のときビジュアル解説タブがアクティブ', () => {
    render(<SubsectionTabs {...defaultProps} activeTab="visual" />);
    const vizTab = screen.getByRole('tab', { name: 'ビジュアル解説' });
    expect(vizTab).toHaveAttribute('aria-selected', 'true');
  });

  it('ビジュアル解説タブをクリックするとonTabChange("visual")が呼ばれる', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SubsectionTabs {...defaultProps} onTabChange={onTabChange} />);

    await user.click(screen.getByRole('tab', { name: 'ビジュアル解説' }));
    expect(onTabChange).toHaveBeenCalledWith('visual');
  });

  it('用語マップタブをクリックするとonTabChange("map")が呼ばれる', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<SubsectionTabs {...defaultProps} activeTab="visual" onTabChange={onTabChange} />);

    await user.click(screen.getByRole('tab', { name: '用語マップ' }));
    expect(onTabChange).toHaveBeenCalledWith('map');
  });
});
