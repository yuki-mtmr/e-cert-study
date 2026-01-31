'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { fetchQuestionById, submitAnswer } from '@/lib/api';
import type { Question } from '@/types';

export default function ReviewPage() {
  const { userId, recordAnswer, getIncorrectQuestionIds, stats } = useLocalProgress();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [remainingIds, setRemainingIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 復習対象の問題IDを取得
  useEffect(() => {
    const ids = getIncorrectQuestionIds();
    setRemainingIds(ids);
    if (ids.length === 0) {
      setLoading(false);
      setError('復習する問題がありません。問題演習を行ってください。');
    }
  }, [getIncorrectQuestionIds]);

  const loadQuestion = useCallback(async (questionId: string) => {
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
        // APIから取得できない場合は次の問題へ
        if (currentIndex + 1 < remainingIds.length) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setError('復習する問題がありません。');
        }
      }
    } catch (e) {
      setError('問題の読み込みに失敗しました。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentIndex, remainingIds.length]);

  // 問題を読み込む
  useEffect(() => {
    if (remainingIds.length > 0 && currentIndex < remainingIds.length) {
      loadQuestion(remainingIds[currentIndex]);
    }
  }, [remainingIds, currentIndex, loadQuestion]);

  const handleAnswer = async (selected: number) => {
    if (!question || !userId) return;

    setSelectedAnswer(selected);

    try {
      const answer = await submitAnswer({
        questionId: question.id,
        userId,
        selectedAnswer: selected,
      });

      setIsCorrect(answer.isCorrect);
      recordAnswer(question.id, answer.isCorrect);
      setShowResult(true);
    } catch (e) {
      // API接続エラーの場合はローカルで判定
      const correct = selected === question.correctAnswer;
      setIsCorrect(correct);
      recordAnswer(question.id, correct);
      setShowResult(true);
      console.error('Answer submission failed, using local evaluation:', e);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">問題を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    const isComplete = error?.includes('完了');
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">復習モード</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className={`${isComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-6 text-center`}>
            <p className={`${isComplete ? 'text-green-800' : 'text-yellow-800'} mb-4`}>
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
                className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">復習モード</h1>
          </div>
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {remainingIds.length} 問
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 進捗バー */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / remainingIds.length) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
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
