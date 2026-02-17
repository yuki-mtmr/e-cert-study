'use client';

interface ErrorCurveSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/** 汎用スライダー（デフォルト 0~1, step=0.01） */
export function ErrorCurveSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: ErrorCurveSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-blue-500"
      />
    </div>
  );
}
