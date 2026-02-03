'use client';

import { useState, useEffect } from 'react';
import type { StudyPlan } from '@/types';
import styles from './StudyPlanForm.module.css';

interface StudyPlanFormData {
  examDate: string;
  targetQuestionsPerDay: number;
}

interface StudyPlanFormProps {
  studyPlan?: StudyPlan;
  onSubmit: (data: StudyPlanFormData) => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

/**
 * 学習プランフォームコンポーネント
 * 試験日と1日の目標問題数を設定
 */
export function StudyPlanForm({
  studyPlan,
  onSubmit,
  onDelete,
  isLoading = false,
}: StudyPlanFormProps) {
  const [examDate, setExamDate] = useState('');
  const [targetQuestionsPerDay, setTargetQuestionsPerDay] = useState(20);

  // 既存のプランがある場合は値を設定
  useEffect(() => {
    if (studyPlan) {
      setExamDate(studyPlan.examDate);
      setTargetQuestionsPerDay(studyPlan.targetQuestionsPerDay);
    }
  }, [studyPlan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション
    if (!examDate) {
      return;
    }

    if (targetQuestionsPerDay < 1) {
      return;
    }

    onSubmit({
      examDate,
      targetQuestionsPerDay,
    });
  };

  const isEditMode = !!studyPlan;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="examDate" className={styles.label}>
          試験日
        </label>
        <input
          type="date"
          id="examDate"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="targetQuestionsPerDay" className={styles.label}>
          1日の目標問題数
        </label>
        <input
          type="number"
          id="targetQuestionsPerDay"
          value={targetQuestionsPerDay}
          onChange={(e) => setTargetQuestionsPerDay(Number(e.target.value))}
          min="1"
          className={styles.input}
          required
        />
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isEditMode ? 'プランを更新' : 'プランを作成'}
        </button>

        {isEditMode && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className={styles.deleteButton}
          >
            削除
          </button>
        )}
      </div>
    </form>
  );
}
