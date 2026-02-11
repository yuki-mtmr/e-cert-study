import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFullscreen } from '../useFullscreen';

describe('useFullscreen', () => {
  let originalRequestFullscreen: typeof Element.prototype.requestFullscreen;
  let originalExitFullscreen: typeof Document.prototype.exitFullscreen;

  beforeEach(() => {
    originalRequestFullscreen = Element.prototype.requestFullscreen;
    originalExitFullscreen = document.exitFullscreen;

    Element.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Element.prototype.requestFullscreen = originalRequestFullscreen;
    document.exitFullscreen = originalExitFullscreen;
  });

  it('初期状態で isFullscreen が false であること', () => {
    const { result } = renderHook(() => useFullscreen());
    expect(result.current.isFullscreen).toBe(false);
  });

  it('toggleFullscreen で requestFullscreen が呼ばれること', async () => {
    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
  });

  it('fullscreenElement がある時に toggleFullscreen で exitFullscreen が呼ばれること', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: document.documentElement,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useFullscreen());

    await act(async () => {
      await result.current.toggleFullscreen();
    });

    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it('fullscreenchange イベントで isFullscreen が更新されること', () => {
    const { result } = renderHook(() => useFullscreen());

    expect(result.current.isFullscreen).toBe(false);

    // 全画面に入った状態をシミュレート
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullscreen).toBe(true);

    // 全画面を解除した状態をシミュレート
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.isFullscreen).toBe(false);
  });

  it('アンマウント時にイベントリスナーが解除されること', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useFullscreen());

    expect(addSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
