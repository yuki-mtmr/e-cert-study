import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, attribute, defaultTheme, enableSystem }: {
    children: React.ReactNode;
    attribute: string;
    defaultTheme: string;
    enableSystem: boolean;
  }) => (
    <div
      data-testid="theme-provider"
      data-attribute={attribute}
      data-default-theme={defaultTheme}
      data-enable-system={String(enableSystem)}
    >
      {children}
    </div>
  ),
}));

import { ThemeProviderWrapper } from '../ThemeProvider';

describe('ThemeProviderWrapper', () => {
  it('children をレンダリングすること', () => {
    render(
      <ThemeProviderWrapper>
        <span>テスト子要素</span>
      </ThemeProviderWrapper>
    );
    expect(screen.getByText('テスト子要素')).toBeInTheDocument();
  });

  it('attribute="class" で ThemeProvider を設定すること', () => {
    render(
      <ThemeProviderWrapper>
        <span>child</span>
      </ThemeProviderWrapper>
    );
    const provider = screen.getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-attribute', 'class');
  });

  it('defaultTheme="light" で設定すること', () => {
    render(
      <ThemeProviderWrapper>
        <span>child</span>
      </ThemeProviderWrapper>
    );
    const provider = screen.getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-default-theme', 'light');
  });

  it('enableSystem=false で設定すること', () => {
    render(
      <ThemeProviderWrapper>
        <span>child</span>
      </ThemeProviderWrapper>
    );
    const provider = screen.getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-enable-system', 'false');
  });
});
