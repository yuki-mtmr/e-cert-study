'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { fetchQuestionById, submitAnswer, fetchReviewItems } from '@/lib/api';
import type { Question, ReviewItem } from '@/types';
import { MASTERY_THRESHOLD } from '@/constants/review';
import { FullscreenButton } from '@/components/FullscreenButton';

/**
 * 復習ページ
 *
 * バックエンドAPIから復習対象問題を取得。
 * API失敗時はlocalStorageにフォールバック。
 */
export default function ReviewPage() {
  const { userId, recordAnswer, getIncorrectQuestionIds, isInitialized } = useLocalProgress();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [remainingIds, setRemainingIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [idsLoaded, setIdsLoaded] = useState(false);
  // 各問題のcorrect_count（バックエンドから取得した復習アイテム情報）
  const [reviewItemMap, setReviewItemMap] = useState<Map<string, ReviewItem>>(new Map());

  // 復習対象の問題IDを取得（バックエンドAPI優先、localStorageフォールバック）
  useEffect(() => {
    if (!isInitialized) return;
    if (idsLoaded) return;

    const loadReviewIds = async () => {
      // バックエンドAPIから復習アイテムを取得
      if (userId) {
        try {
          const items = await fetchReviewItems(userId);
          if (items.length > 0) {
            const ids = items.map(item => item.questionId);
            const itemMap = new Map<string, ReviewItem>();
            items.forEach(item => itemMap.set(item.questionId, item));
            setRemainingIds(ids);
            setReviewItemMap(itemMap);
            setIdsLoaded(true);
            return;
          }
        } catch {
          // API失敗時はlocalStorageにフォールバック
        }
      }

      // localStorageフォールバック
      const ids = getIncorrectQuestionIds();
      if (ids.length > 0) {
        setRemainingIds(ids);
        setIdsLoaded(true);
      } else {
        // localStorageに回答データがあるかチェック
        const stored = localStorage.getItem('e-cert-study-progress');
        if (!stored) {
          setLoading(false);
          setError('復習する問題がありません。問題演習を行ってください。');
          setIdsLoaded(true);
        } else {
          try {
            const data = JSON.parse(stored);
            const latestResults = new Map<string, boolean>();
            for (const answer of data.answers || []) {
              latestResults.set(answer.questionId, answer.isCorrect);
            }
            const hasIncorrect = Array.from(latestResults.values()).some(v => !v);
            if (!hasIncorrect) {
              setLoading(false);
              setError('復習する問題がありません。問題演習を行ってください。');
              setIdsLoaded(true);
            }
          } catch {
            setLoading(false);
            setError('復習する問題がありません。問題演習を行ってください。');
            setIdsLoaded(true);
          }
        }
      }
    };

    loadReviewIds();
  }, [isInitialized, idsLoaded, getIncorrectQuestionIds, userId]);

  // 問題を読み込む
  useEffect(() => {
    if (remainingIds.length === 0 || currentIndex >= remainingIds.length) {
      return;
    }

    const questionId = remainingIds[currentIndex];

    const loadQuestion = async () => {
      setLoading(true);
      setError(null);
      setShowResult(false);
      setSelectedAnswer(null);
      setIsCorrect(null);

      try {
        const q = await fetchQuestionById(questionId);
        if (q) {
          setQuestion(q);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      } catch (e) {
        setError('問題の読み込みに失敗しました。');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [remainingIds, currentIndex]);

  const handleAnswer = async (selected: number) => {
    if (!question) return;

    setSelectedAnswer(selected);
    const localCorrect = selected === question.correctAnswer;

    try {
      if (userId) {
        const answer = await submitAnswer({
          questionId: question.id,
          userId,
          selectedAnswer: selected,
        });
        setIsCorrect(answer.isCorrect);
        recordAnswer(question.id, answer.isCorrect);
      } else {
        setIsCorrect(localCorrect);
        recordAnswer(question.id, localCorrect);
      }
      setShowResult(true);
    } catch {
      setIsCorrect(localCorrect);
      recordAnswer(question.id, localCorrect);
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < remainingIds.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setError('全ての復習問題を完了しました！');
      setQuestion(null);
    }
  };

  // 現在の問題のcorrect_count（バックエンドから取得した場合のみ表示）
  const currentReviewItem = question ? reviewItemMap.get(question.id) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">問題を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    const isComplete = error?.includes('完了');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">復習モード</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className={`${isComplete ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'} border rounded-lg p-6 text-center`}>
            <p className={`${isComplete ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'} mb-4`}>
              {isComplete ? '🎉 ' : ''}{error}
            </p>
            <div className="space-x-4">
              <Link
                href="/practice"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                問題演習へ
              </Link>
              <Link
                href="/"
                className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ホームへ
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">復習モード</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentIndex + 1} / {remainingIds.length} 問
            </span>
            <FullscreenButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 進捗バー */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / remainingIds.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 復習進捗表示（バックエンドから取得した場合） */}
        {currentReviewItem && (
          <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm dark:shadow-gray-900/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">習得進捗</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(currentReviewItem.correctCount / MASTERY_THRESHOLD) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentReviewItem.correctCount} / {MASTERY_THRESHOLD}
              </span>
            </div>
          </div>
        )}

        <QuestionCard
          key={question.id}
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={selectedAnswer ?? undefined}
          isCorrect={isCorrect ?? undefined}
        />

        {showResult && (
          <div className="mt-6 text-center">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {currentIndex + 1 < remainingIds.length ? '次の問題へ →' : '復習を完了する'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
