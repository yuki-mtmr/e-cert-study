'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { StudyPlanForm } from '@/components/StudyPlanForm';
import { ProgressChart } from '@/components/ProgressChart';
import {
  fetchStudyPlan,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  fetchStudyPlanSummary,
} from '@/lib/api';
import type { StudyPlan, StudyPlanSummary } from '@/types';
import styles from './page.module.css';

export default function StudyPlanPage() {
  const { userId } = useLocalProgress();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [summary, setSummary] = useState<StudyPlanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 学習プラン読み込み
  useEffect(() => {
    async function loadStudyPlan() {
      try {
        setIsLoading(true);
        const plan = await fetchStudyPlan(userId);
        setStudyPlan(plan);

        if (plan) {
          const summaryData = await fetchStudyPlanSummary(userId);
          setSummary(summaryData);
        }
      } catch (error) {
        console.error('Failed to load study plan:', error);
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          setError('サーバーに接続できません。バックエンドが起動しているか確認してください。');
        } else {
          setError('学習プランの読み込みに失敗しました');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadStudyPlan();
  }, [userId]);

  // フォーム送信
  const handleSubmit = async (data: { examDate: string; targetQuestionsPerDay: number }) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (studyPlan) {
        // 更新
        const updated = await updateStudyPlan(userId, {
          examDate: data.examDate,
          targetQuestionsPerDay: data.targetQuestionsPerDay,
        });
        setStudyPlan(updated);
      } else {
        // 新規作成
        const created = await createStudyPlan({
          userId,
          examDate: data.examDate,
          targetQuestionsPerDay: data.targetQuestionsPerDay,
        });
        setStudyPlan(created);
      }

      // サマリー再取得
      const summaryData = await fetchStudyPlanSummary(userId);
      setSummary(summaryData);
    } catch {
      setError('学習プランの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // プラン削除
  const handleDelete = async () => {
    if (!confirm('学習プランを削除しますか？')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteStudyPlan(userId);
      setStudyPlan(null);
      setSummary(null);
    } catch {
      setError('学習プランの削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>学習プラン</h1>
        <Link href="/" className={styles.backLink}>
          ホームに戻る
        </Link>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        {/* 進捗グラフ */}
        {studyPlan && summary && (
          <section className={styles.chartSection}>
            <ProgressChart summary={summary} />
          </section>
        )}

        {/* プラン設定フォーム */}
        <section className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            {studyPlan ? 'プラン設定を編集' : '新しい学習プランを作成'}
          </h2>
          <StudyPlanForm
            studyPlan={studyPlan || undefined}
            onSubmit={handleSubmit}
            onDelete={studyPlan ? handleDelete : undefined}
            isLoading={isSubmitting}
          />
        </section>
      </main>
    </div>
  );
}
