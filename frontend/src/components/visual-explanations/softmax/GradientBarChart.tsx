'use client';

import { useMemo } from 'react';
import {
  softmax1D,
  computeGradient,
  PIPELINE_COLORS,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import { KeyPoint } from './shared';

const GRADIENT_LOGITS = [2.0, 1.0, 0.1];
const GRADIENT_TEACHER = 0;

export function GradientBarChart() {
  const y = useMemo(() => softmax1D(GRADIENT_LOGITS), []);
  const bars = useMemo(() => computeGradient(y, GRADIENT_TEACHER, 1), [y]);

  const maxAbs = Math.max(
    1,
    ...bars.map((b) => Math.max(Math.abs(b.yValue), Math.abs(b.tValue), Math.abs(b.dxValue))),
  );
  const W = 400;
  const H = 180;
  const barW = 18;
  const groupW = barW * 3 + 8; // 3本 + gap
  const groupGap = 30;
  const baseY = H * 0.55;
  const leftPad = 70;

  const scale = (v: number) => (v / (maxAbs * 1.1)) * (baseY - 16);

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">4. 勾配バーチャート</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="勾配バーチャート">
        {/* 0ライン */}
        <line
          x1={leftPad - 10} y1={baseY}
          x2={W - 10} y2={baseY}
          stroke="currentColor" strokeOpacity={0.25}
          strokeDasharray="4,2"
        />
        <text x={leftPad - 14} y={baseY + 4} textAnchor="end" className="text-[9px] fill-gray-400">0</text>

        {bars.map((bar, i) => {
          const gx = leftPad + i * (groupW + groupGap);
          const yH = scale(bar.yValue);
          const tH = scale(bar.tValue);
          const dxH = scale(bar.dxValue);

          return (
            <g key={i}>
              {/* y (青) */}
              <rect
                x={gx}
                y={yH >= 0 ? baseY - yH : baseY}
                width={barW}
                height={Math.max(1, Math.abs(yH))}
                fill={PIPELINE_COLORS.softmax.hex}
                rx={2}
              />
              <text
                x={gx + barW / 2} y={baseY - yH - 3}
                textAnchor="middle"
                className="text-[8px] fill-blue-500"
              >
                {bar.yValue.toFixed(2)}
              </text>

              {/* t (緑) */}
              <rect
                x={gx + barW + 2}
                y={tH >= 0 ? baseY - tH : baseY}
                width={barW}
                height={Math.max(1, Math.abs(tH))}
                fill={PIPELINE_COLORS.teacher.hex}
                rx={2}
              />
              {bar.tValue > 0 && (
                <text
                  x={gx + barW + 2 + barW / 2} y={baseY - tH - 3}
                  textAnchor="middle"
                  className="text-[8px] fill-emerald-500"
                >
                  {bar.tValue.toFixed(0)}
                </text>
              )}

              {/* (y-t)/N (オレンジ) */}
              <rect
                x={gx + barW * 2 + 4}
                y={dxH >= 0 ? baseY - dxH : baseY}
                width={barW}
                height={Math.max(1, Math.abs(dxH))}
                fill={PIPELINE_COLORS.gradient.hex}
                rx={2}
              />
              <text
                x={gx + barW * 2 + 4 + barW / 2}
                y={dxH >= 0 ? baseY - dxH - 3 : baseY + Math.abs(dxH) + 10}
                textAnchor="middle"
                className="text-[8px] fill-amber-500"
              >
                {bar.dxValue >= 0 ? '+' : ''}{bar.dxValue.toFixed(2)}
              </text>

              {/* クラスラベル */}
              <text
                x={gx + groupW / 2 - 2}
                y={H - 6}
                textAnchor="middle"
                className="text-[11px] fill-gray-600 dark:fill-gray-300"
              >
                {bar.label}
                {i === GRADIENT_TEACHER && (
                  <tspan className="fill-emerald-500"> ★</tspan>
                )}
              </text>
            </g>
          );
        })}

        {/* 凡例 */}
        <g transform={`translate(${W - 110}, 8)`} className="text-[10px]">
          <rect width={10} height={10} fill={PIPELINE_COLORS.softmax.hex} rx={2} />
          <text x={14} y={9} className="fill-gray-600 dark:fill-gray-300">y (予測)</text>
          <rect y={15} width={10} height={10} fill={PIPELINE_COLORS.teacher.hex} rx={2} />
          <text x={14} y={24} className="fill-gray-600 dark:fill-gray-300">t (正解)</text>
          <rect y={30} width={10} height={10} fill={PIPELINE_COLORS.gradient.hex} rx={2} />
          <text x={14} y={39} className="fill-gray-600 dark:fill-gray-300">(y-t)/N</text>
        </g>
      </svg>

      <KeyPoint text="(y-t)/N — 正解クラス(★)だけ負の勾配 → 予測を正解に近づける方向に更新" />
    </section>
  );
}
