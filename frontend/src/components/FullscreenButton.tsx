'use client';

import { useFullscreen } from '@/hooks/useFullscreen';

/**
 * 全画面表示トグルボタン
 * ヘッダー右端に配置するアイコンボタン。
 * 全画面時は縮小アイコン、通常時は拡大アイコンを表示。
 */
export function FullscreenButton() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const label = isFullscreen ? '全画面を解除' : '全画面表示';

  return (
    <button
      onClick={toggleFullscreen}
      aria-label={label}
      title={label}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {isFullscreen ? (
        // 縮小アイコン（全画面解除）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      ) : (
        // 拡大アイコン（全画面表示）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      )}
    </button>
  );
}
