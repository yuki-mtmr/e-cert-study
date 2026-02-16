'use client';

import { ThemeProvider } from 'next-themes';

/**
 * next-themes の ThemeProvider をラップするクライアントコンポーネント
 * class属性でテーマを切り替え、デフォルトはライトモード
 */
export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
