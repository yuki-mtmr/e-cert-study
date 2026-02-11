'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import {
  fetchReviewItemsDetailed,
  fetchReviewStats,
  triggerReviewBackfill,
} from '@/lib/api';
import type { ReviewItemDetail, ReviewStats } from '@/types';
import { MASTERY_THRESHOLD } from '@/constants/review';

type TabType = 'active' | 'mastered';

export default function ReviewDashboardPage() {
  const { userId } = useLocalProgress();
  const [items, setItems] = useState<ReviewItemDetail[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  const loadData = useCallback(
    async (tab: TabType) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [itemsData, statsData] = await Promise.all([
          fetchReviewItemsDetailed(userId, tab),
          fetchReviewStats(userId),
        ]);
        setItems(itemsData);
        if (statsData) {
          setStats(statsData);
        }
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadData(activeTab);
  }, [loadData, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleBackfill = async () => {
    if (!userId || backfilling) return;
    setBackfilling(true);
    setBackfillMessage(null);
    try {
      const result = await triggerReviewBackfill(userId);
      setBackfillMessage(
        `${result.examsProcessed}件の模試から${result.itemsCreated}件の復習アイテムを取り込みました`
      );
      await loadData(activeTab);
    } catch {
      setBackfillMessage('取り込みに失敗しました');
    } finally {
      setBackfilling(false);
    }
  };

  // 習得率の計算
  const masteryRate =
    stats && stats.totalCount > 0
      ? Math.round((stats.masteredCount / stats.totalCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">復習管理</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/" className="text-blue-600 hover:underline">
                ホーム
              </Link>
              <Link href="/review" className="text-blue-600 hover:underline">
                復習モード
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 統計カード */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">
              {stats?.activeCount ?? 0}
            </p>
            <p className="text-sm text-gray-600">未習得</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats?.masteredCount ?? 0}
            </p>
            <p className="text-sm text-gray-600">習得済み</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats?.totalCount ?? 0}
            </p>
            <p className="text-sm text-gray-600">合計</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {masteryRate}%
            </p>
            <p className="text-sm text-gray-600">習得率</p>
          </div>
        </section>

        {/* バックフィルボタン */}
        <section className="mb-6">
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {backfilling ? '取り込み中...' : '過去の模試データを取り込む'}
          </button>
          {backfillMessage && (
            <p className="mt-2 text-sm text-gray-700">{backfillMessage}</p>
          )}
        </section>

        {/* タブ */}
        <section className="mb-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('active')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'active'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              未習得 ({stats?.activeCount ?? 0})
            </button>
            <button
              onClick={() => handleTabChange('mastered')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'mastered'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              習得済み ({stats?.masteredCount ?? 0})
            </button>
          </div>
        </section>

        {/* アイテムリスト */}
        <section>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="text-lg">{error}</p>
              <button
                onClick={() => loadData(activeTab)}
                className="mt-4 text-blue-600 hover:underline text-sm"
              >
                再試行
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">復習アイテムはありません</p>
              <p className="mt-2 text-sm">
                問題演習や模試で間違えた問題が自動的に追加されます
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-gray-800 flex-1">
                      {item.questionContent}
                    </p>
                    {item.questionCategoryName && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                        {item.questionCategoryName}
                      </span>
                    )}
                  </div>
                  {/* 進捗バー */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>
                        正解数: {item.correctCount} / {MASTERY_THRESHOLD}
                      </span>
                      <span>
                        {new Date(item.lastAnsweredAt).toLocaleDateString(
                          'ja-JP'
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === 'mastered'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (item.correctCount / MASTERY_THRESHOLD) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-8 text-center">
          <Link
            href="/review"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            復習を開始する
          </Link>
        </section>
      </main>
    </div>
  );
}
