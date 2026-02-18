import { useState, useCallback } from 'react';
import type {
  MemorizationQuestion,
  QuizMode,
  QuizAnswerLabel,
  UserAnswer,
  QuizSessionResult,
} from '@/types/memorization';
import {
  shuffleQuestions,
  filterByCategories,
  filterByIds,
  calculateCategoryStats,
  getIncorrectQuestions,
} from '@/lib/memorization-quiz';

interface StartOptions {
  categories: string[];
  shuffle: boolean;
}

interface UseMemorizationQuizReturn {
  mode: QuizMode;
  currentQuestion: MemorizationQuestion | null;
  currentIndex: number;
  totalQuestions: number;
  correctCount: number;
  lastAnswer: UserAnswer | null;
  sessionResult: QuizSessionResult | null;
  startQuiz: (options: StartOptions) => void;
  answerQuestion: (selected: QuizAnswerLabel) => void;
  nextQuestion: () => void;
  retryIncorrect: () => void;
  resetQuiz: () => void;
}

/**
 * 暗記クイズセッションの状態管理
 */
export function useMemorizationQuiz(
  allQuestions: readonly MemorizationQuestion[],
): UseMemorizationQuizReturn {
  const [mode, setMode] = useState<QuizMode>('setup');
  const [activeQuestions, setActiveQuestions] = useState<MemorizationQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [lastAnswer, setLastAnswer] = useState<UserAnswer | null>(null);
  const [sessionResult, setSessionResult] = useState<QuizSessionResult | null>(null);

  const correctCount = answers.filter((a) => a.isCorrect).length;

  const startQuiz = useCallback(
    (options: StartOptions) => {
      let filtered = filterByCategories(allQuestions, options.categories);
      if (filtered.length === 0) return;
      if (options.shuffle) {
        filtered = shuffleQuestions(filtered);
      }
      setActiveQuestions(filtered);
      setCurrentIndex(0);
      setAnswers([]);
      setLastAnswer(null);
      setSessionResult(null);
      setMode('active');
    },
    [allQuestions],
  );

  const answerQuestion = useCallback(
    (selected: QuizAnswerLabel) => {
      const q = activeQuestions[currentIndex];
      if (!q) return;
      const isCorrect = selected === q.answer;
      const answer: UserAnswer = { questionId: q.id, selected, isCorrect };
      setAnswers((prev) => [...prev, answer]);
      setLastAnswer(answer);
    },
    [activeQuestions, currentIndex],
  );

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= activeQuestions.length) {
      const allAnswers = answers;
      const correct = allAnswers.filter((a) => a.isCorrect).length;
      setSessionResult({
        totalQuestions: activeQuestions.length,
        correctCount: correct,
        accuracy: Math.round((correct / activeQuestions.length) * 100),
        answers: allAnswers,
      });
      setMode('results');
    } else {
      setCurrentIndex(nextIdx);
      setLastAnswer(null);
    }
  }, [currentIndex, activeQuestions, answers]);

  const retryIncorrect = useCallback(() => {
    const incorrect = getIncorrectQuestions(activeQuestions, answers);
    if (incorrect.length === 0) return;
    setActiveQuestions(incorrect);
    setCurrentIndex(0);
    setAnswers([]);
    setLastAnswer(null);
    setSessionResult(null);
    setMode('active');
  }, [activeQuestions, answers]);

  const resetQuiz = useCallback(() => {
    setMode('setup');
    setActiveQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setLastAnswer(null);
    setSessionResult(null);
  }, []);

  return {
    mode,
    currentQuestion: activeQuestions[currentIndex] ?? null,
    currentIndex,
    totalQuestions: activeQuestions.length,
    correctCount,
    lastAnswer,
    sessionResult,
    startQuiz,
    answerQuestion,
    nextQuestion,
    retryIncorrect,
    resetQuiz,
  };
}
