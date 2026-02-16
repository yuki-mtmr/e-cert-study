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
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
