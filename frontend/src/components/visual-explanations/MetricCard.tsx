import { VisualFraction } from '@/components/visual-explanations/VisualFraction';
import type { MetricFormulaV2 } from '@/lib/visual-explanations/confusion-matrix';

interface MetricCardProps {
  metric: MetricFormulaV2;
  isSelected: boolean;
  onClick: () => void;
}

/** クリック可能な指標カード（分数+覚え方） */
export function MetricCard({ metric, isSelected, onClick }: MetricCardProps) {
  return (
    <button
      type="button"
      data-testid={`metric-card-${metric.id}`}
      onClick={onClick}
      className={`w-full text-left border rounded-lg p-3 transition-all cursor-pointer
        ${isSelected
          ? 'ring-2 ring-indigo-500 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-bold text-gray-900 dark:text-gray-100">
          {metric.name}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {metric.enName}
        </span>
      </div>
      <div className="flex justify-center my-2">
        <VisualFraction fraction={metric.fraction} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {metric.tip}
      </p>
    </button>
  );
}
