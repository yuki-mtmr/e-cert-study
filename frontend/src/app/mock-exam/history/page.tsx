'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { fetchMockExamHistory, fetchMockExamResult } from '@/lib/api';
import { MockExamResult } from '@/components/MockExamResult';
import { requestAIAnalysis } from '@/lib/api';
import type {
  MockExamHistoryItem,
  MockExamResult as MockExamResultType,
} from '@/types';

export default function MockExamHistoryPage() {
  const { userId, isInitialized } = useLocalProgress();
  const [exams, setExams] = useState<MockExamHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<MockExamResultType | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMockExamHistory(userId);
      setExams(data.exams);
      setTotalCount(data.totalCount);
    } catch {
      setError('履歴の読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isInitialized || !userId) return;
    loadHistory();
  }, [isInitialized, userId, loadHistory]);

  const handleSelectExam = async (examId: string) => {
    try {
      const result = await fetchMockExamResult(examId);
      if (result) {
        setSelectedResult(result);
      }
    } catch {
      // エラーは静かに処理
    }
  };

  const handleRequestAIAnalysis = async () => {
    if (!selectedResult) return;
    setAiLoading(true);
    try {
      const data = await requestAIAnalysis(selectedResult.examId, userId);
      setSelectedResult({ ...selectedResult, aiAnalysis: data.aiAnalysis });
    } catch {
      // AI分析失敗
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">模試履歴</h1>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ホームに戻る
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
            <button
              onClick={loadHistory}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              再試行
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 詳細表示モード
  if (selectedResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">模試結果詳細</h1>
            <button
              onClick={() => setSelectedResult(null)}
              className="text-blue-600 hover:underline text-sm"
            >
              一覧に戻る
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <MockExamResult
            result={selectedResult}
            onRequestAIAnalysis={handleRequestAIAnalysis}
            aiLoading={aiLoading}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">模試履歴</h1>
          <div className="flex gap-4">
            <Link href="/mock-exam" className="text-blue-600 hover:underline text-sm">
              模試を受験する
            </Link>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ホームに戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {exams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">まだ模試を受験していません。</p>
            <Link
              href="/mock-exam"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              模試を受験する
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">全 {totalCount} 件</p>
            <div className="space-y-3">
              {exams.map((exam) => (
                <button
                  key={exam.examId}
                  onClick={() => handleSelectExam(exam.examId)}
                  className="w-full bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(exam.startedAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        スコア: {exam.score}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {exam.passed !== null && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            exam.passed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {exam.passed ? '合格' : '不合格'}
                        </span>
                      )}
                      {exam.status === 'in_progress' && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          受験中
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
