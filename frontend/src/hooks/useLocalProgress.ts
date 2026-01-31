'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'e-cert-study-progress';
const USER_ID_KEY = 'e-cert-study-user-id';

interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
}

interface ProgressData {
  answers: AnswerRecord[];
}

interface ProgressStats {
  totalAnswered: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
}

/**
 * ユーザーIDを生成
 */
function generateUserId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * localStorageに進捗を保存・復元するフック
 */
export function useLocalProgress() {
  const [progressData, setProgressData] = useState<ProgressData>({ answers: [] });
  const [userId, setUserId] = useState<string>('');

  // 初期化: localStorageからデータを復元
  useEffect(() => {
    // ユーザーID
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = generateUserId();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);

    // 進捗データ
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as ProgressData;
        setProgressData(data);
      } catch {
        // 不正なデータは無視
      }
    }
  }, []);

  // 進捗データが変更されたらlocalStorageに保存
  useEffect(() => {
    if (progressData.answers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    }
  }, [progressData]);

  // 回答を記録
  const recordAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    setProgressData((prev) => ({
      answers: [...prev.answers, { questionId, isCorrect }],
    }));
  }, []);

  // 間違えた問題のIDを取得（最新の結果が不正解の問題のみ）
  const getIncorrectQuestionIds = useCallback((): string[] => {
    // 各問題の最新の回答結果を取得
    const latestResults = new Map<string, boolean>();
    for (const answer of progressData.answers) {
      latestResults.set(answer.questionId, answer.isCorrect);
    }

    // 最新の結果が不正解の問題のIDを返す
    return Array.from(latestResults.entries())
      .filter(([, isCorrect]) => !isCorrect)
      .map(([questionId]) => questionId);
  }, [progressData.answers]);

  // 進捗をリセット
  const resetProgress = useCallback(() => {
    setProgressData({ answers: [] });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 統計情報を計算
  const stats: ProgressStats = {
    totalAnswered: progressData.answers.length,
    correctCount: progressData.answers.filter((a) => a.isCorrect).length,
    incorrectCount: progressData.answers.filter((a) => !a.isCorrect).length,
    accuracy:
      progressData.answers.length > 0
        ? Math.round(
            (progressData.answers.filter((a) => a.isCorrect).length /
              progressData.answers.length) *
              100
          )
        : 0,
  };

  return {
    userId,
    stats,
    recordAnswer,
    getIncorrectQuestionIds,
    resetProgress,
  };
}
