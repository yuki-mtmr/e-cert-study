'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { useMockExamTimer } from '@/hooks/useMockExamTimer';
import { QuestionCard } from '@/components/QuestionCard';
import { MockExamResult } from '@/components/MockExamResult';
import type {
  MockExamStartResponse,
  MockExamQuestion,
  MockExamResult as MockExamResultType,
} from '@/types';
import {
  startMockExam,
  submitMockExamAnswer,
  finishMockExam,
  requestAIAnalysis,
} from '@/lib/api';

type Phase = 'intro' | 'active' | 'result';

/** 試験エリアの配分テーブル */
const EXAM_AREAS = [
  { name: '応用数学', count: 10 },
  { name: '機械学習', count: 25 },
  { name: '深層学習の基礎', count: 30 },
  { name: '深層学習の応用', count: 25 },
  { name: '開発・運用環境', count: 10 },
];

export default function MockExamPage() {
  const { userId } = useLocalProgress();
  const [phase, setPhase] = useState<Phase>('intro');
  const [examData, setExamData] = useState<MockExamStartResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [result, setResult] = useState<MockExamResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleTimeUp = useCallback(async () => {
    if (examData) {
      await handleFinish();
    }
  }, [examData]);

  const timer = useMockExamTimer(
    phase === 'active' ? (examData?.timeLimitMinutes ?? 120) : 0,
    handleTimeUp,
  );

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await startMockExam(userId);
      setExamData(data);
      setPhase('active');
      setCurrentIndex(0);
      setAnswers(new Map());
    } catch (e) {
      setError(e instanceof Error ? e.message : '模試の開始に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (selectedIndex: number) => {
    if (!examData) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentIndex, selectedIndex);
    setAnswers(newAnswers);

    try {
      await submitMockExamAnswer(examData.examId, {
        questionIndex: currentIndex,
        selectedAnswer: selectedIndex,
      });
    } catch {
      // 回答送信失敗はローカルに保持して続行
    }
  };

  const handleFinish = async () => {
    if (!examData) return;
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      const examResult = await finishMockExam(examData.examId, userId);
      setResult(examResult);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '模試の終了に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAIAnalysis = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const data = await requestAIAnalysis(result.examId, userId);
      setResult({ ...result, aiAnalysis: data.aiAnalysis });
    } catch {
      // AI分析失敗は静かに無視
    } finally {
      setAiLoading(false);
    }
  };

  const currentQuestion = examData?.questions[currentIndex];

  // イントロフェーズ
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">E資格 模擬試験</h1>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ホームに戻る
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">E資格 模擬試験</h2>
            <p className="text-xl text-gray-600 mb-8">100問・120分の本番シミュレーション</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">出題配分</h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-gray-600">分野</th>
                    <th className="py-2 text-right text-gray-600">問題数</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAM_AREAS.map((area) => (
                    <tr key={area.name} className="border-b last:border-0">
                      <td className="py-2">{area.name}</td>
                      <td className="py-2 text-right font-medium">{area.count}問</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2">合計</td>
                    <td className="py-2 text-right">100問</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={loading}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '準備中...' : '模試を開始する'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // アクティブフェーズ
  if (phase === 'active' && examData && currentQuestion) {
    const questionForCard = {
      id: currentQuestion.questionId,
      categoryId: '',
      content: currentQuestion.content,
      choices: currentQuestion.choices,
      correctAnswer: -1,
      explanation: '',
      difficulty: 0,
      source: '',
      contentType: currentQuestion.contentType,
      images: currentQuestion.images || [],
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* タイマーヘッダー */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              問題 {currentIndex + 1} / {examData.totalQuestions}
            </span>
            <span
              className={`text-lg font-mono font-bold ${
                timer.isWarning ? 'text-red-600 animate-pulse' : 'text-gray-800'
              }`}
            >
              {timer.formattedTime}
            </span>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              模試を終了する
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-4">
          {/* エリア表示 */}
          <div className="text-sm text-gray-500 mb-2">
            分野: {currentQuestion.examArea}
          </div>

          {/* 問題表示 */}
          <QuestionCard
            question={questionForCard}
            onAnswer={handleAnswer}
            showResult={false}
            selectedAnswer={answers.get(currentIndex)}
          />

          {/* ナビゲーション */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              前の問題
            </button>
            <button
              onClick={() =>
                setCurrentIndex(Math.min(examData.totalQuestions - 1, currentIndex + 1))
              }
              disabled={currentIndex >= examData.totalQuestions - 1}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              次の問題
            </button>
          </div>

          {/* 問題グリッド */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">回答状況</h3>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: examData.totalQuestions }, (_, i) => {
                const isAnswered = answers.has(i);
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-8 h-8 text-xs rounded ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isAnswered
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* 確認ダイアログ */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4">模試を終了しますか？</h3>
              <p className="text-gray-600 mb-4">
                {answers.size}/{examData.totalQuestions}問 回答済み
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  続ける
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  {loading ? '終了中...' : '終了する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 結果フェーズ
  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">模試結果</h1>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              ホームに戻る
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <MockExamResult
            result={result}
            onRequestAIAnalysis={handleRequestAIAnalysis}
            aiLoading={aiLoading}
          />

          <div className="flex gap-4 mt-6">
            <Link
              href="/mock-exam/history"
              className="flex-1 py-3 rounded-lg text-center bg-gray-200 hover:bg-gray-300 font-medium"
            >
              模試履歴を見る
            </Link>
            <button
              onClick={() => {
                setPhase('intro');
                setExamData(null);
                setResult(null);
                setAnswers(new Map());
                setCurrentIndex(0);
                setError(null);
              }}
              className="flex-1 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              もう一度受験する
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ローディング
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
