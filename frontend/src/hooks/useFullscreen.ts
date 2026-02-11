import { useState, useEffect, useCallback } from 'react';

/**
 * Fullscreen API をラップするカスタムフック
 * @returns isFullscreen - 全画面表示中かどうか
 * @returns toggleFullscreen - 全画面表示をトグルする関数
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
