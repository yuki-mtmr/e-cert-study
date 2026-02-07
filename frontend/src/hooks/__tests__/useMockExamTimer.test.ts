import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMockExamTimer } from '../useMockExamTimer';

describe('useMockExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期値が正しいこと', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(120, onTimeUp));

    expect(result.current.remainingSeconds).toBe(120 * 60);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isWarning).toBe(false);
  });

  it('formattedTimeが正しいフォーマットであること', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(120, onTimeUp));

    expect(result.current.formattedTime).toBe('120:00');
  });

  it('1秒後にカウントダウンされること', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(120, onTimeUp));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(120 * 60 - 1);
  });

  it('10分未満でisWarningがtrueになること', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(10, onTimeUp));

    // 1秒経過後（残り9:59）
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isWarning).toBe(true);
  });

  it('時間切れでonTimeUpが呼ばれること', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(1, onTimeUp));

    // 1分 = 60秒経過
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('0分以下にならないこと', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useMockExamTimer(1, onTimeUp));

    // 2分経過（1分のタイマー）
    act(() => {
      vi.advanceTimersByTime(120 * 1000);
    });

    expect(result.current.remainingSeconds).toBe(0);
  });
});
