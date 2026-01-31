'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';

export default function Home() {
  const { stats, userId, getIncorrectQuestionIds } = useLocalProgress();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">E資格学習アプリ</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 進捗サマリー */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">学習進捗</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalAnswered}</p>
              <p className="text-sm text-gray-600">回答数</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.correctCount}</p>
              <p className="text-sm text-gray-600">正解数</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.incorrectCount}</p>
              <p className="text-sm text-gray-600">不正解数</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.accuracy}%</p>
              <p className="text-sm text-gray-600">正解率</p>
            </div>
          </div>
        </section>

        {/* 学習モード選択 */}
        <section className="grid md:grid-cols-2 gap-6">
          <Link
            href="/practice"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📚</span>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
                問題演習
              </h2>
            </div>
            <p className="text-gray-600">
              ランダムに出題される問題に挑戦しましょう。
              AIが抽出した問題で効率的に学習できます。
            </p>
          </Link>

          <Link
            href="/review"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">🔄</span>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
                復習モード
              </h2>
            </div>
            <p className="text-gray-600">
              間違えた問題を重点的に復習します。
              苦手分野を克服しましょう。
            </p>
            {getIncorrectQuestionIds().length > 0 && (
              <span className="inline-block mt-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                {getIncorrectQuestionIds().length}問の復習待ち
              </span>
            )}
          </Link>

          <Link
            href="/stats"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📊</span>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
                分析ダッシュボード
              </h2>
            </div>
            <p className="text-gray-600">
              学習傾向や苦手分野を分析します。
              効果的な学習計画を立てましょう。
            </p>
          </Link>

          <Link
            href="/import"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📄</span>
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600">
                問題インポート
              </h2>
            </div>
            <p className="text-gray-600">
              PDFからAIが問題を自動抽出します。
              参考書や問題集を取り込みましょう。
            </p>
          </Link>
        </section>

        {/* ユーザー情報 */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>ユーザーID: {userId}</p>
          <p className="mt-1">データはブラウザに保存されています</p>
        </footer>
      </main>
    </div>
  );
}
