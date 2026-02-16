'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { MockExamHistoryItem } from '@/types';

interface ChartDataPoint {
  label: string;
  score: number;
  passingLine: number;
  examNumber: number;
}

interface MockExamScoreChartProps {
  exams: MockExamHistoryItem[];
  passingThreshold?: number;
}

/**
 * 模試履歴データをグラフ用データに変換
 *
 * @param exams - 模試履歴アイテムの配列
 * @param passingThreshold - 合格ライン（%）
 * @returns グラフ用データ配列
 */
export function transformExamsToChartData(
  exams: MockExamHistoryItem[],
  passingThreshold: number,
): ChartDataPoint[] {
  return exams
    .filter((exam) => exam.status === 'finished')
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .map((exam, index) => {
      const date = new Date(exam.startedAt);
      return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        score: exam.score,
        passingLine: passingThreshold,
        examNumber: index + 1,
      };
    });
}

/**
 * 模試スコア推移グラフ
 */
export function MockExamScoreChart({
  exams,
  passingThreshold = 65,
}: MockExamScoreChartProps) {
  const chartData = transformExamsToChartData(exams, passingThreshold);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/20 rounded-lg shadow-md p-6 mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">スコア推移</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          完了した模試が2件以上になるとグラフが表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/20 rounded-lg shadow-md p-6 mb-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">スコア推移</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'score') return [`${value}%`, 'スコア'];
              return [value, name];
            }}
          />
          <ReferenceLine
            y={passingThreshold}
            stroke="var(--accent-red)"
            strokeDasharray="5 5"
            label={{ value: `合格ライン ${passingThreshold}%`, position: 'right', fill: 'var(--accent-red)', fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--accent-blue)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent-blue)', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
