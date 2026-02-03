'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { StudyPlanSummary } from '@/types';
import styles from './ProgressChart.module.css';

interface ProgressChartProps {
  summary: StudyPlanSummary;
}

/**
 * 進捗グラフコンポーネント
 * 日別の学習量と正解率を可視化
 */
export function ProgressChart({ summary }: ProgressChartProps) {
  const { daysRemaining, totalAnswered, totalCorrect, accuracy, streak, dailyProgress } = summary;

  // グラフ用データを加工
  const chartData = dailyProgress.map((day) => ({
    date: day.date.slice(5), // MM-DD形式に
    目標: day.targetCount,
    実績: day.actualCount,
    正解: day.correctCount,
    正解率: day.actualCount > 0 ? Math.round((day.correctCount / day.actualCount) * 100) : 0,
  }));

  const hasData = dailyProgress.length > 0;
  const isExpired = daysRemaining < 0;

  return (
    <div className={styles.container}>
      {/* サマリーカード */}
      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>残り日数</div>
          <div className={`${styles.cardValue} ${isExpired ? styles.expired : ''}`}>
            {isExpired ? (
              <span className={styles.expiredText}>試験日を過ぎています</span>
            ) : (
              <>
                <span>{daysRemaining}</span>
                <span className={styles.cardUnit}>日</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>総回答数</div>
          <div className={styles.cardValue}>
            <span>{totalAnswered}</span>
            <span className={styles.cardUnit}>問</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>正解率</div>
          <div className={styles.cardValue}>
            <span>{accuracy}%</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>連続学習</div>
          <div className={styles.cardValue}>
            <span>{streak}</span>
            <span className={styles.cardUnit}>日</span>
          </div>
        </div>
      </div>

      {/* グラフ */}
      <div className={styles.chartContainer}>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="目標" fill="#e0e0e0" />
              <Bar yAxisId="left" dataKey="実績" fill="#4a90d9" />
              <Bar yAxisId="left" dataKey="正解" fill="#2ecc71" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="正解率"
                stroke="#e74c3c"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noData}>
            まだ学習データがありません
          </div>
        )}
      </div>
    </div>
  );
}
