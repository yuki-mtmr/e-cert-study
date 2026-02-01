'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { fetchSmartQuestion, fetchRandomQuestion, submitAnswer } from '@/lib/api';
import type { Question } from '@/types';

export default function PracticePage() {
  const { userId, recordAnswer } = useLocalProgress();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsCorrect(null);

    try {
      // 苦手分野優先でスマート出題、失敗したらランダム出題にフォールバック
      let q: Question | null = null;
      if (userId) {
        q = await fetchSmartQuestion(userId);
      }
      if (!q) {
        q = await fetchRandomQuestion();
      }
      if (q) {
        setQuestion(q);
      } else {
        setError('問題が見つかりませんでした。問題をインポートしてください。');
      }
    } catch (e) {
      setError('問題の読み込みに失敗しました。');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

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
    loadQuestion();
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">問題演習</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-4">{error}</p>
            <Link
              href="/import"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              問題をインポート
            </Link>
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
            <h1 className="text-xl font-bold text-gray-900">問題演習</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {question && (
          <>
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
                  次の問題へ →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
