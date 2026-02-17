'use client';

import { useMemo } from 'react';
import type { TargetScenario } from '@/lib/visual-explanations/bias-variance';
import { generateDots } from '@/lib/visual-explanations/bias-variance';

interface StaticTargetProps {
  scenario: TargetScenario;
}

const DOT_COUNT = 12;
const SIZE = 200;
const CENTER = SIZE / 2;
const RINGS = [80, 55, 30];

/** 座標(-1~1)をSVG座標に変換 */
function toSvg(val: number): number {
  return CENTER + val * (RINGS[0] - 5);
}

/** 単一の的SVG（ドット配置固定） */
export function StaticTarget({ scenario }: StaticTargetProps) {
  const dots = useMemo(
    () => generateDots(DOT_COUNT, scenario.bias, scenario.bias, scenario.variance),
    [scenario.bias, scenario.variance],
  );

  return (
    <div data-testid="static-target" className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[160px]"
        role="img"
        aria-label={`${scenario.label}: ${scenario.caption}`}
      >
        {/* 同心円（的の環） */}
        {RINGS.map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            strokeWidth={1}
          />
        ))}
        {/* bullseye中心 */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={3}
          className="fill-emerald-500"
        />
        {/* ドット群 */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            data-testid="target-dot"
            cx={toSvg(dot.x)}
            cy={toSvg(dot.y)}
            r={3}
            className="fill-red-500"
            opacity={0.8}
          />
        ))}
      </svg>
      <div className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center">
        {scenario.label}
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
        {scenario.caption}
      </div>
    </div>
  );
}
