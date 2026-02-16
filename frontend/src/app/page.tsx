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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">E資格学習アプリ</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 進捗サマリー */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">学習進捗</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalAnswered}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">回答数</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.correctCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">正解数</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.incorrectCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">不正解数</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.accuracy}%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">正解率</p>
            </div>
          </div>
        </section>

        {/* 学習モード選択 */}
        <section className="grid md:grid-cols-2 gap-6">
          <Link
            href="/practice"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📚</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">
                問題演習
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              ランダムに出題される問題に挑戦しましょう。
              AIが抽出した問題で効率的に学習できます。
            </p>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow">
            <Link href="/review" className="block group">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">🔄</span>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">
                  復習モード
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                間違えた問題を重点的に復習します。
                苦手分野を克服しましょう。
              </p>
              {getIncorrectQuestionIds().length > 0 && (
                <span className="inline-block mt-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-sm px-2 py-1 rounded">
                  {getIncorrectQuestionIds().length}問の復習待ち
                </span>
              )}
            </Link>
            <Link
              href="/review/dashboard"
              className="block mt-2 text-sm text-blue-600 hover:underline"
            >
              復習管理ダッシュボード
            </Link>
          </div>

          <Link
            href="/stats"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📊</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">
                分析ダッシュボード
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              学習傾向や苦手分野を分析します。
              効果的な学習計画を立てましょう。
            </p>
          </Link>

          <Link
            href="/import"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📄</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">
                問題インポート
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              PDFからAIが問題を自動抽出します。
              参考書や問題集を取り込みましょう。
            </p>
          </Link>

          <Link
            href="/study-plan"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📅</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600">
                学習プラン
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              試験日を設定し、日々の学習進捗を
              グラフで可視化しましょう。
            </p>
          </Link>

          <Link
            href="/mock-exam"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6 hover:shadow-lg transition-shadow group border-2 border-orange-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-4">
              <span className="text-4xl mr-4">📝</span>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-orange-600">
                模擬試験
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              100問・120分の本番シミュレーション。
              合否判定と詳細な分析で実力を確認。
            </p>
          </Link>
          <Link
            href="/mock-exam/history"
            className="text-sm text-orange-600 hover:underline mt-1 ml-1 inline-block"
          >
            過去の結果を見る
          </Link>
        </section>

        {/* ユーザー情報 */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>ユーザーID: {userId}</p>
          <p className="mt-1">データはブラウザに保存されています</p>
        </footer>
      </main>
    </div>
  );
}
