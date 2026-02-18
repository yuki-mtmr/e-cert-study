'use client';

import { useState, useMemo } from 'react';
import katex from 'katex';
import {
  softmax1D,
  computeGradient,
  PIPELINE_COLORS,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const SVG_W = 360;
const SVG_H = 200;
const PAD = { top: 20, right: 20, bottom: 30, left: 40 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

/** Q4: 勾配バーチャート */
export function BackwardGradientChart() {
  const [logits, setLogits] = useState([2.0, 1.0, 0.1]);
  const [correctClass, setCorrectClass] = useState(0);

  const y = useMemo(() => softmax1D(logits), [logits]);
  const bars = useMemo(
    () => computeGradient(y, correctClass),
    [y, correctClass],
  );

  // Y軸範囲: -1 〜 1
  const yMin = -1;
  const yMax = 1;
  const toSvgY = (v: number) =>
    PAD.top + ((yMax - v) / (yMax - yMin)) * PLOT_H;
  const zeroY = toSvgY(0);

  const barGroupWidth = PLOT_W / bars.length;
  const barWidth = barGroupWidth * 0.2;

  const formulaHtml = katex.renderToString(
    'dx = \\frac{y - t}{N}',
    { throwOnError: false, displayMode: false },
  );

  return (
    <div data-testid="backward-gradient-chart" className="space-y-3">
      {/* SVGバーチャート */}
      <svg
        data-testid="gradient-bar-chart"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-md"
        role="img"
        aria-label="勾配バーチャート"
      >
        {/* Y=0 ライン */}
        <line
          x1={PAD.left}
          y1={zeroY}
          x2={PAD.left + PLOT_W}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity={0.3}
        />

        {/* バーグループ */}
        {bars.map((bar, i) => {
          const cx = PAD.left + barGroupWidth * i + barGroupWidth / 2;
          const yBarX = cx - barWidth * 1.5;
          const tBarX = cx - barWidth * 0.5;
          const dxBarX = cx + barWidth * 0.5;

          return (
            <g key={bar.classIndex}>
              {/* yValue バー（青） */}
              <rect
                x={yBarX}
                y={Math.min(zeroY, toSvgY(bar.yValue))}
                width={barWidth}
                height={Math.abs(toSvgY(bar.yValue) - zeroY)}
                fill={PIPELINE_COLORS.softmax.hex}
                opacity={0.8}
              />
              {/* tValue バー（緑） */}
              <rect
                x={tBarX}
                y={Math.min(zeroY, toSvgY(bar.tValue))}
                width={barWidth}
                height={Math.abs(toSvgY(bar.tValue) - zeroY)}
                fill={PIPELINE_COLORS.teacher.hex}
                opacity={0.8}
              />
              {/* dxValue バー（橙） */}
              <rect
                x={dxBarX}
                y={Math.min(zeroY, toSvgY(bar.dxValue))}
                width={barWidth}
                height={Math.abs(toSvgY(bar.dxValue) - zeroY)}
                fill={PIPELINE_COLORS.gradient.hex}
                opacity={0.8}
              />
              {/* ラベル */}
              <text
                x={cx}
                y={SVG_H - 6}
                textAnchor="middle"
                className="text-[10px] fill-gray-600 dark:fill-gray-300"
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {/* 凡例 */}
        <g transform={`translate(${PAD.left + 4}, ${PAD.top})`}>
          <rect width={8} height={8} fill={PIPELINE_COLORS.softmax.hex} />
          <text x={12} y={8} className="text-[9px] fill-gray-600 dark:fill-gray-300">y</text>
          <rect y={12} width={8} height={8} fill={PIPELINE_COLORS.teacher.hex} />
          <text x={12} y={20} className="text-[9px] fill-gray-600 dark:fill-gray-300">t</text>
          <rect y={24} width={8} height={8} fill={PIPELINE_COLORS.gradient.hex} />
          <text x={12} y={32} className="text-[9px] fill-gray-600 dark:fill-gray-300">dx</text>
        </g>
      </svg>

      {/* logitsスライダー */}
      {logits.map((val, i) => (
        <ErrorCurveSlider
          key={i}
          label={`logit[${i}] = ${val.toFixed(1)}`}
          value={val}
          onChange={(v) => {
            const next = [...logits];
            next[i] = v;
            setLogits(next);
          }}
          min={-5}
          max={5}
          step={0.1}
        />
      ))}

      {/* 正解クラス選択 */}
      <div data-testid="correct-class-selector" className="flex gap-2 items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">正解クラス:</span>
        {[0, 1, 2].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={correctClass === c}
            onClick={() => setCorrectClass(c)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              correctClass === c
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            class {c}
          </button>
        ))}
      </div>

      {/* 数式表示 */}
      <div className="text-center">
        <span dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      </div>

      {/* 直感メモ */}
      <div
        data-testid="gradient-intuition"
        className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200"
      >
        予測が正解に近い → 勾配が小さい → 変化が少ない。逆に、予測がずれているほど大きな勾配で修正される。
      </div>
    </div>
  );
}
