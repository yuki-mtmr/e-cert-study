/**
 * ローカル進捗管理フックのテスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalProgress } from '../useLocalProgress';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useLocalProgress', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('初期状態では進捗が空', () => {
    const { result } = renderHook(() => useLocalProgress());

    expect(result.current.stats).toEqual({
      totalAnswered: 0,
      correctCount: 0,
      incorrectCount: 0,
      accuracy: 0,
    });
  });

  it('回答を記録できる', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', true);
    });

    expect(result.current.stats.totalAnswered).toBe(1);
    expect(result.current.stats.correctCount).toBe(1);
    expect(result.current.stats.accuracy).toBe(100);
  });

  it('不正解も記録できる', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', true);
      result.current.recordAnswer('q2', false);
    });

    expect(result.current.stats.totalAnswered).toBe(2);
    expect(result.current.stats.correctCount).toBe(1);
    expect(result.current.stats.incorrectCount).toBe(1);
    expect(result.current.stats.accuracy).toBe(50);
  });

  it('間違えた問題のIDを取得できる', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', true);
      result.current.recordAnswer('q2', false);
      result.current.recordAnswer('q3', false);
    });

    expect(result.current.getIncorrectQuestionIds()).toEqual(['q2', 'q3']);
  });

  it('同じ問題を複数回間違えても重複しない', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', false);
      result.current.recordAnswer('q1', false); // 同じ問題をもう一度間違える
      result.current.recordAnswer('q2', false);
    });

    // ユニークなIDのみを返す
    const incorrectIds = result.current.getIncorrectQuestionIds();
    expect(incorrectIds).toEqual(['q1', 'q2']);
    expect(incorrectIds.length).toBe(2); // 3ではなく2
  });

  it('一度間違えて後で正解した問題は復習対象から除外', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', false); // 間違える
      result.current.recordAnswer('q1', true);  // 後で正解
      result.current.recordAnswer('q2', false); // これは間違えたまま
    });

    // 最新の結果が正解なら復習対象から除外
    expect(result.current.getIncorrectQuestionIds()).toEqual(['q2']);
  });

  it('localStorageに保存される', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', true);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('localStorageから復元できる', async () => {
    const savedData = JSON.stringify({
      answers: [
        { questionId: 'q1', isCorrect: true },
        { questionId: 'q2', isCorrect: false },
      ],
    });
    // 先にlocalStorageにデータをセット
    mockLocalStorage.setItem('e-cert-study-progress', savedData);

    const { result, rerender } = renderHook(() => useLocalProgress());

    // useEffectが実行されるまで待つ
    await act(async () => {
      rerender();
    });

    expect(result.current.stats.totalAnswered).toBe(2);
    expect(result.current.stats.correctCount).toBe(1);
  });

  it('進捗をリセットできる', () => {
    const { result } = renderHook(() => useLocalProgress());

    act(() => {
      result.current.recordAnswer('q1', true);
      result.current.recordAnswer('q2', false);
    });

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.stats.totalAnswered).toBe(0);
    expect(mockLocalStorage.removeItem).toHaveBeenCalled();
  });

  it('ユーザーIDを生成・保持する', () => {
    const { result } = renderHook(() => useLocalProgress());

    expect(result.current.userId).toBeDefined();
    expect(result.current.userId.length).toBeGreaterThan(0);
  });

  it('初期化完了状態を提供する', async () => {
    const savedData = JSON.stringify({
      answers: [
        { questionId: 'q1', isCorrect: false },
      ],
    });
    mockLocalStorage.setItem('e-cert-study-progress', savedData);

    const { result, rerender } = renderHook(() => useLocalProgress());

    // useEffectが実行されるまで待つ
    await act(async () => {
      rerender();
    });

    // 初期化完了後は true
    expect(result.current.isInitialized).toBe(true);
    // データも読み込まれている
    expect(result.current.getIncorrectQuestionIds()).toEqual(['q1']);
  });

  describe('タブ間同期', () => {
    it('他タブでのlocalStorage変更を検知して同期する', async () => {
      const { result } = renderHook(() => useLocalProgress());

      // 初期状態を確認
      expect(result.current.stats.totalAnswered).toBe(0);

      // 他タブがlocalStorageを更新したことをシミュレート
      const newData = {
        answers: [
          { questionId: 'q1', isCorrect: true },
          { questionId: 'q2', isCorrect: false },
        ],
      };

      await act(async () => {
        // storageイベントを発火
        const event = new StorageEvent('storage', {
          key: 'e-cert-study-progress',
          newValue: JSON.stringify(newData),
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      // React状態が更新されること
      expect(result.current.stats.totalAnswered).toBe(2);
      expect(result.current.stats.correctCount).toBe(1);
      expect(result.current.stats.incorrectCount).toBe(1);
    });

    it('別のキーのstorageイベントは無視する', async () => {
      const { result } = renderHook(() => useLocalProgress());

      // 最初に回答を記録
      await act(async () => {
        result.current.recordAnswer('q1', true);
      });

      expect(result.current.stats.totalAnswered).toBe(1);

      // 別のキーのstorageイベントを発火
      await act(async () => {
        const event = new StorageEvent('storage', {
          key: 'other-key',
          newValue: JSON.stringify({ answers: [] }),
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      // 状態は変わらない
      expect(result.current.stats.totalAnswered).toBe(1);
    });

    it('localStorageが削除された場合はリセットする', async () => {
      const { result } = renderHook(() => useLocalProgress());

      // 最初に回答を記録
      await act(async () => {
        result.current.recordAnswer('q1', true);
        result.current.recordAnswer('q2', false);
      });

      expect(result.current.stats.totalAnswered).toBe(2);

      // 他タブでデータが削除されたことをシミュレート
      await act(async () => {
        const event = new StorageEvent('storage', {
          key: 'e-cert-study-progress',
          newValue: null,
          oldValue: JSON.stringify({ answers: [] }),
        });
        window.dispatchEvent(event);
      });

      // リセットされること
      expect(result.current.stats.totalAnswered).toBe(0);
    });

    it('不正なJSONのstorageイベントは無視する', async () => {
      const { result } = renderHook(() => useLocalProgress());

      // 最初に回答を記録
      await act(async () => {
        result.current.recordAnswer('q1', true);
      });

      expect(result.current.stats.totalAnswered).toBe(1);

      // 不正なJSONのstorageイベントを発火
      await act(async () => {
        const event = new StorageEvent('storage', {
          key: 'e-cert-study-progress',
          newValue: 'invalid-json',
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      // 状態は変わらない
      expect(result.current.stats.totalAnswered).toBe(1);
    });

    it('アンマウント時にイベントリスナーをクリーンアップする', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useLocalProgress());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
