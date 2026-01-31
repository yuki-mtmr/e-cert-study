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
});
