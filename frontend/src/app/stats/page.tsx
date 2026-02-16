'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import {
  fetchOverviewStats,
  fetchWeakAreas,
  fetchDailyProgress,
  fetchCategoryCoverage,
  type OverviewStats,
  type CategoryStats,
  type DailyProgress,
  type CategoryCoverage,
} from '@/lib/api';

export default function StatsPage() {
  const { userId, stats: localStats } = useLocalProgress();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [weakAreas, setWeakAreas] = useState<CategoryStats[]>([]);
  const [progress, setProgress] = useState<DailyProgress[]>([]);
  const [coverage, setCoverage] = useState<CategoryCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const [overviewData, weakAreasData, progressData, coverageData] = await Promise.all([
          fetchOverviewStats(userId),
          fetchWeakAreas(userId, 5),
          fetchDailyProgress(userId, 30),
          fetchCategoryCoverage(userId),
        ]);

        if (overviewData) {
          setOverview(overviewData);
          setWeakAreas(weakAreasData);
          setProgress(progressData);
          setCoverage(coverageData);
        } else {
          // APIから取得できない場合はローカルデータを使用
          setUseLocalData(true);
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
        setUseLocalData(true);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  // ローカルデータを使用する場合
  const displayStats = useLocalData
    ? {
        totalAnswered: localStats.totalAnswered,
        correctCount: localStats.correctCount,
        incorrectCount: localStats.incorrectCount,
        accuracy: localStats.accuracy,
      }
    : overview;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">統計を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">分析ダッシュボード</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 概要統計 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">学習概要</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="総回答数"
              value={displayStats?.totalAnswered || 0}
              color="blue"
            />
            <StatCard
              label="正解数"
              value={displayStats?.correctCount || 0}
              color="green"
            />
            <StatCard
              label="不正解数"
              value={displayStats?.incorrectCount || 0}
              color="red"
            />
            <StatCard
              label="正解率"
              value={`${displayStats?.accuracy || 0}%`}
              color="purple"
            />
          </div>

          {/* 合格水準との比較 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              合格水準との比較（目標: 70%以上）
            </h3>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (displayStats?.accuracy || 0) >= 70
                    ? 'bg-green-500'
                    : (displayStats?.accuracy || 0) >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(displayStats?.accuracy || 0, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span className="text-green-600 font-medium">合格ライン 70%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        {/* カテゴリ別網羅率 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            カテゴリ別網羅率
          </h2>
          {coverage.length > 0 ? (
            <div className="space-y-4">
              {coverage.map((cat) => (
                <div key={cat.categoryId} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {cat.categoryName}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        正答率: {cat.accuracy}%
                      </span>
                      <span
                        className={`font-bold ${
                          cat.coverageRate >= 70
                            ? 'text-green-600'
                            : cat.coverageRate >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {cat.coverageRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        cat.coverageRate >= 70
                          ? 'bg-green-500'
                          : cat.coverageRate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${cat.coverageRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {cat.answeredCount}/{cat.totalQuestions}問
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {useLocalData
                ? 'ローカルデータでは網羅率の分析ができません。サーバーに接続してください。'
                : 'カテゴリデータがありません。'}
            </p>
          )}
        </section>

        {/* 苦手分野 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            苦手分野（正解率が低い順）
          </h2>
          {weakAreas.length > 0 ? (
            <div className="space-y-4">
              {weakAreas.map((area) => (
                <div key={area.categoryId} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {area.categoryName}
                    </span>
                    <span
                      className={`font-bold ${
                        area.accuracy >= 70
                          ? 'text-green-600'
                          : area.accuracy >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {area.accuracy}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        area.accuracy >= 70
                          ? 'bg-green-500'
                          : area.accuracy >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${area.accuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {area.totalAnswered}問中{area.correctCount}問正解
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              {useLocalData
                ? 'ローカルデータでは苦手分野の分析ができません。サーバーに接続してください。'
                : 'まだ十分なデータがありません。問題を解いてみましょう！'}
            </p>
          )}
        </section>

        {/* 日別進捗 */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/20 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            日別学習進捗（過去30日間）
          </h2>
          {progress.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* 簡易グラフ */}
                <div className="flex items-end justify-between h-40 gap-1">
                  {progress.map((day, index) => {
                    const maxAnswered = Math.max(...progress.map((d) => d.answered));
                    const height = maxAnswered > 0 ? (day.answered / maxAnswered) * 100 : 0;
                    const correctRatio = day.answered > 0 ? (day.correct / day.answered) * 100 : 0;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center"
                        title={`${day.date}: ${day.answered}問回答, ${day.correct}問正解`}
                      >
                        <div
                          className="w-full rounded-t relative overflow-hidden"
                          style={{ height: `${height}%`, minHeight: day.answered > 0 ? '4px' : '0' }}
                        >
                          {/* 不正解部分 */}
                          <div className="absolute bottom-0 w-full bg-red-300" style={{ height: `${100 - correctRatio}%` }} />
                          {/* 正解部分 */}
                          <div className="absolute top-0 w-full bg-green-500" style={{ height: `${correctRatio}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>{progress[0]?.date}</span>
                  <span>{progress[progress.length - 1]?.date}</span>
                </div>
                <div className="flex justify-center gap-4 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded" />
                    正解
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-300 rounded" />
                    不正解
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              まだ学習履歴がありません。問題を解いてみましょう！
            </p>
          )}
        </section>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/practice"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
          >
            問題演習を始める
          </Link>
          {(displayStats?.incorrectCount || 0) > 0 && (
            <Link
              href="/review"
              className="bg-orange-600 text-white px-8 py-3 rounded-lg font-medium text-center hover:bg-orange-700 transition-colors"
            >
              苦手問題を復習する
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-center`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}
