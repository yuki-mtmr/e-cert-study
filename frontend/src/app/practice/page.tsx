'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QuestionCard } from '@/components/QuestionCard';
import { CategorySelector } from '@/components/CategorySelector';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import {
  fetchSmartQuestion,
  fetchRandomQuestion,
  fetchCategoriesTree,
  submitAnswer,
} from '@/lib/api';
import type { Question, CategoryTree } from '@/types';
import { FullscreenButton } from '@/components/FullscreenButton';

const CATEGORY_STORAGE_KEY = 'selectedCategoryIds';

type PracticeMode = 'setup' | 'active' | 'complete';

interface PracticeResult {
  questionId: string;
  isCorrect: boolean;
}

export default function PracticePage() {
  const { userId, recordAnswer } = useLocalProgress();

  // モード管理
  const [mode, setMode] = useState<PracticeMode>('setup');

  // 設定
  const [questionCount, setQuestionCount] = useState<number>(10);

  // 演習状態
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<PracticeResult[]>([]);

  // 現在の問題（後方互換性のため）
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // カテゴリ関連（複数選択対応）
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // カテゴリ一覧を取得
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategoriesTree();
        setCategories(data);
      } catch (e) {
        console.error('Failed to load categories:', e);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // localStorageから選択カテゴリを復元
    const savedCategoryIds = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (savedCategoryIds) {
      try {
        const parsed = JSON.parse(savedCategoryIds);
        if (Array.isArray(parsed)) {
          setSelectedCategoryIds(parsed);
        }
      } catch {
        // パースエラーの場合は無視
      }
    }

    loadCategories();
  }, []);

  // カテゴリ選択をlocalStorageに保存
  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    if (categoryIds.length > 0) {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryIds));
    } else {
      localStorage.removeItem(CATEGORY_STORAGE_KEY);
    }
  };

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsCorrect(null);

    try {
      let q: Question | null = null;

      // カテゴリが選択されている場合はそのカテゴリからランダム出題
      if (selectedCategoryIds.length > 0) {
        q = await fetchRandomQuestion(selectedCategoryIds);

        // カテゴリフィルタで問題が見つからない場合、フィルタなしでリトライ
        if (!q) {
          console.warn('No questions in selected categories, falling back to all');
          q = await fetchRandomQuestion();
        }
      } else {
        // カテゴリ未選択の場合は苦手分野優先でスマート出題
        if (userId) {
          q = await fetchSmartQuestion(userId);
        }
        if (!q) {
          q = await fetchRandomQuestion();
        }
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
  }, [userId, selectedCategoryIds]);

  // 演習開始
  const handleStart = () => {
    setMode('active');
    setCurrentIndex(0);
    setResults([]);
    loadQuestion();
  };

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
        setShowResult(true);
        setResults(prev => [...prev, { questionId: question.id, isCorrect: answer.isCorrect }]);
      } else {
        setIsCorrect(localCorrect);
        recordAnswer(question.id, localCorrect);
        setShowResult(true);
        setResults(prev => [...prev, { questionId: question.id, isCorrect: localCorrect }]);
      }
    } catch (e) {
      setIsCorrect(localCorrect);
      recordAnswer(question.id, localCorrect);
      setShowResult(true);
      setResults(prev => [...prev, { questionId: question.id, isCorrect: localCorrect }]);
      console.error('Answer submission failed, using local evaluation:', e);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    // 問題数に達したら完了画面へ
    // questionCountが0（全問）の場合は無限に続ける
    if (questionCount > 0 && nextIndex >= questionCount) {
      setMode('complete');
      return;
    }

    setCurrentIndex(nextIndex);
    loadQuestion();
  };

  // 再度演習を開始
  const handleRestart = () => {
    setMode('setup');
    setQuestion(null);
    setError(null);
  };

  // 設定画面
  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-emerald-600 hover:text-emerald-800 mr-4">
              ← 戻る
            </Link>
            <h1 className="text-xl font-bold text-gray-900">E資格 問題演習</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* カテゴリ選択 */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📚</span>
                カテゴリを選択
              </h2>
              <CategorySelector
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                onSelectMultiple={handleCategorySelect}
                loading={categoriesLoading}
                multiSelect={true}
              />
              {selectedCategoryIds.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  未選択の場合は全カテゴリから出題されます
                </p>
              )}
            </div>

            {/* 問題数選択 */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📝</span>
                問題数を選択
              </h2>
              <div className="flex flex-wrap gap-4">
                {[10, 20, 30, 0].map((count) => (
                  <label key={count} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="questionCount"
                      value={count}
                      checked={questionCount === count}
                      onChange={() => setQuestionCount(count)}
                      className="sr-only peer"
                    />
                    <span className="px-4 py-2 rounded-lg border-2 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 border-gray-200 text-gray-600 transition-colors">
                      {count === 0 ? '全問' : `${count}問`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* スタートボタン */}
            <button
              onClick={handleStart}
              disabled={categoriesLoading}
              className="w-full py-3 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {categoriesLoading ? '読み込み中...' : '演習をスタート'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 完了画面
  if (mode === 'complete') {
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <Link href="/" className="text-emerald-600 hover:text-emerald-800 mr-4">
              ← ホームへ
            </Link>
            <h1 className="text-xl font-bold text-gray-900">演習結果</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">演習完了！</h2>

            <div className="mb-8">
              <div className="text-6xl font-bold text-emerald-600 mb-2">
                {percentage}%
              </div>
              <div className="text-gray-600">
                {totalCount}問中 {correctCount}問正解
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                もう一度演習する
              </button>
              <Link
                href="/review"
                className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                復習する
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 演習中（active mode）
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
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
            <Link href="/" className="text-emerald-600 hover:text-emerald-800 mr-4">
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
              className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
            >
              問題をインポート
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 演習中の進捗表示
  const totalQuestions = questionCount === 0 ? '∞' : questionCount;
  const progress = `${currentIndex + 1} / ${totalQuestions}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleRestart}
              className="text-emerald-600 hover:text-emerald-800 mr-4"
            >
              ← 設定に戻る
            </button>
            <h1 className="text-xl font-bold text-gray-900">問題演習</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              {progress}
            </span>
            <FullscreenButton />
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
                  className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  {questionCount > 0 && currentIndex + 1 >= questionCount ? '結果を見る' : '次の問題へ →'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
