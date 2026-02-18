import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemorizationQuiz } from '../useMemorizationQuiz';
import type { MemorizationQuestion } from '@/types/memorization';

const QUESTIONS: MemorizationQuestion[] = [
  { id: 1, category: '最適化', question: 'Q1', choices: ['A', 'B', 'C', 'D'], answer: 'A', hint: 'H1' },
  { id: 2, category: 'CNN', question: 'Q2', choices: ['A', 'B', 'C', 'D'], answer: 'B', hint: 'H2' },
  { id: 3, category: 'CNN', question: 'Q3', choices: ['A', 'B', 'C', 'D'], answer: 'C', hint: 'H3' },
];

describe('useMemorizationQuiz', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態はsetupモード', () => {
    const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
    expect(result.current.mode).toBe('setup');
  });

  describe('startQuiz', () => {
    it('activeモードに遷移する', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      expect(result.current.mode).toBe('active');
      expect(result.current.currentQuestion).not.toBeNull();
      expect(result.current.currentIndex).toBe(0);
    });

    it('カテゴリフィルタが適用される', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['CNN'], shuffle: false });
      });
      expect(result.current.totalQuestions).toBe(2);
    });

    it('該当問題がなければsetupのまま', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['存在しない'], shuffle: false });
      });
      expect(result.current.mode).toBe('setup');
    });
  });

  describe('answerQuestion', () => {
    it('正解時にisCorrect=trueを記録', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      act(() => {
        result.current.answerQuestion('A'); // Q1正解=A
      });
      expect(result.current.lastAnswer?.isCorrect).toBe(true);
      expect(result.current.correctCount).toBe(1);
    });

    it('不正解時にisCorrect=falseを記録', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      act(() => {
        result.current.answerQuestion('D'); // Q1正解=AなのでDは不正解
      });
      expect(result.current.lastAnswer?.isCorrect).toBe(false);
    });
  });

  describe('nextQuestion', () => {
    it('次の問題に進む', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      act(() => {
        result.current.answerQuestion('A');
      });
      act(() => {
        result.current.nextQuestion();
      });
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.lastAnswer).toBeNull();
    });

    it('最後の問題後にresultsモードに遷移', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化'], shuffle: false });
      });
      // 1問だけなので回答→次でresults
      act(() => {
        result.current.answerQuestion('A');
      });
      act(() => {
        result.current.nextQuestion();
      });
      expect(result.current.mode).toBe('results');
      expect(result.current.sessionResult).not.toBeNull();
      expect(result.current.sessionResult!.totalQuestions).toBe(1);
    });
  });

  describe('retryIncorrect', () => {
    it('不正解の問題だけで再開する', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      // Q1(最適化,A): 正解
      act(() => { result.current.answerQuestion('A'); });
      act(() => { result.current.nextQuestion(); });
      // Q2(CNN,B): 不正解
      act(() => { result.current.answerQuestion('A'); });
      act(() => { result.current.nextQuestion(); });
      // Q3(CNN,C): 不正解
      act(() => { result.current.answerQuestion('A'); });
      act(() => { result.current.nextQuestion(); });

      expect(result.current.mode).toBe('results');

      act(() => {
        result.current.retryIncorrect();
      });
      expect(result.current.mode).toBe('active');
      expect(result.current.totalQuestions).toBe(2);
    });
  });

  describe('resetQuiz', () => {
    it('setupモードに戻る', () => {
      const { result } = renderHook(() => useMemorizationQuiz(QUESTIONS));
      act(() => {
        result.current.startQuiz({ categories: ['最適化', 'CNN'], shuffle: false });
      });
      act(() => {
        result.current.resetQuiz();
      });
      expect(result.current.mode).toBe('setup');
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.correctCount).toBe(0);
    });
  });
});
