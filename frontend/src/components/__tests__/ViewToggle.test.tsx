import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from '../ViewToggle';

describe('ViewToggle', () => {
  it('リストとマップの2つのタブを表示する', () => {
    render(<ViewToggle viewMode="list" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /リスト/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /マップ/ })).toBeInTheDocument();
  });

  it('role="tablist"を持つ', () => {
    render(<ViewToggle viewMode="list" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('リストモード時にリストタブがaria-selected=trueになる', () => {
    render(<ViewToggle viewMode="list" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /リスト/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /マップ/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('マップモード時にマップタブがaria-selected=trueになる', () => {
    render(<ViewToggle viewMode="map" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /マップ/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /リスト/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('マップタブをクリックするとonChangeが"map"で呼ばれる', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ViewToggle viewMode="list" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /マップ/ }));
    expect(onChange).toHaveBeenCalledWith('map');
  });

  it('リストタブをクリックするとonChangeが"list"で呼ばれる', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ViewToggle viewMode="map" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /リスト/ }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
