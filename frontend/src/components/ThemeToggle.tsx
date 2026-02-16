'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * ダークモード切替用フローティングボタン
 * 右下に固定配置、月/太陽アイコンで切替
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      aria-label="テーマ切替"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shadow-lg flex items-center justify-center text-lg hover:scale-110 transition-transform cursor-pointer"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
