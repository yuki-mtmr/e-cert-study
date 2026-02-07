'use client';

import type { MockExamResult as MockExamResultType } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MockExamResultProps {
  result: MockExamResultType;
  onRequestAIAnalysis: () => void;
  aiLoading?: boolean;
}

/**
 * 模試結果表示コンポーネント
 */
export function MockExamResult({
  result,
  onRequestAIAnalysis,
  aiLoading = false,
}: MockExamResultProps) {
  const isPassed = result.passed === true;

  return (
    <div className="space-y-6">
      {/* 合否バナー */}
      <div
        className={`p-8 rounded-lg text-center ${
          isPassed
            ? 'bg-green-100 border-2 border-green-500'
            : 'bg-red-100 border-2 border-red-500'
        }`}
      >
        <p
          className={`text-4xl font-bold ${
            isPassed ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {isPassed ? '合格' : '不合格'}
        </p>
        <p className="text-2xl mt-2 text-gray-800">
          {result.score}% ({result.correctCount}/{result.totalQuestions})
        </p>
        <p className="text-sm text-gray-600 mt-1">
          合格ライン: {result.passingThreshold}%
        </p>
      </div>

      {/* 合格ラインバー */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`absolute h-full rounded-full ${
              isPassed ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(result.score, 100)}%` }}
          />
          <div
            className="absolute h-full w-0.5 bg-yellow-600"
            style={{ left: `${result.passingThreshold}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0%</span>
          <span className="text-yellow-600">合格ライン {result.passingThreshold}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* カテゴリ別スコア */}
      {result.categoryScores.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">カテゴリ別成績</h3>
          <div className="space-y-3">
            {result.categoryScores.map((cat) => (
              <div key={cat.areaName} className="flex items-center gap-3">
                <span className="w-32 text-sm font-medium truncate">{cat.areaName}</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getGradeColor(cat.grade)}`}
                    style={{ width: `${cat.accuracy}%` }}
                  />
                </div>
                <span className="text-sm w-12 text-right">{cat.accuracy}%</span>
                <span
                  className={`text-sm font-bold w-6 text-center ${getGradeTextColor(cat.grade)}`}
                >
                  {cat.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ルールベース分析 */}
      {result.analysis && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">分析</h3>
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={result.analysis} />
          </div>
        </div>
      )}

      {/* AI分析 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {result.aiAnalysis ? (
          <>
            <h3 className="text-lg font-semibold mb-4">AI詳細分析</h3>
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={result.aiAnalysis} />
            </div>
          </>
        ) : (
          <button
            onClick={onRequestAIAnalysis}
            disabled={aiLoading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              aiLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {aiLoading ? 'AI分析を生成中...' : 'AI詳細分析を生成する'}
          </button>
        )}
      </div>
    </div>
  );
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'S': return 'bg-purple-500';
    case 'A': return 'bg-blue-500';
    case 'B': return 'bg-green-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-orange-500';
    case 'F': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getGradeTextColor(grade: string): string {
  switch (grade) {
    case 'S': return 'text-purple-600';
    case 'A': return 'text-blue-600';
    case 'B': return 'text-green-600';
    case 'C': return 'text-yellow-600';
    case 'D': return 'text-orange-600';
    case 'F': return 'text-red-600';
    default: return 'text-gray-600';
  }
}
