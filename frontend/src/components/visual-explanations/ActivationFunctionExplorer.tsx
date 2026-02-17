'use client';

import { useState, useMemo } from 'react';
import katex from 'katex';
import {
  getActivationInfos,
  sigmoid,
  sigmoidDerivative,
  tanhActivation,
  tanhDerivative,
  relu,
  reluDerivative,
} from '@/lib/visual-explanations/activation-functions';
import type { ActivationId } from '@/lib/visual-explanations/activation-functions';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const INFOS = getActivationInfos();

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const WIDTH = 400;
const HEIGHT = 300;
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

// 各関数ごとのY範囲
const Y_RANGES: Record<ActivationId, { min: number; max: number }> = {
  sigmoid: { min: -0.2, max: 1.2 },
  tanh: { min: -1.5, max: 1.5 },
  relu: { min: -1, max: 7 },
};

const Z_MIN = -6;
const Z_MAX = 6;

function InlineKatex({ latex }: { latex: string }) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  });
  return (
    <span
      className="inline-block"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** 勾配の健全性判定 */
function getGradientStatus(derivativeValue: number, activeId: ActivationId): {
  label: string;
  color: string;
} {
  // ReLUは特殊: 0 or 1
  if (activeId === 'relu') {
    return derivativeValue > 0
      ? { label: '健全（勾配=1）', color: 'text-green-600 dark:text-green-400' }
      : { label: '消失（勾配=0）', color: 'text-red-600 dark:text-red-400' };
  }
  if (derivativeValue > 0.2) {
    return { label: '健全', color: 'text-green-600 dark:text-green-400' };
  }
  if (derivativeValue > 0.05) {
    return { label: '減少中', color: 'text-yellow-600 dark:text-yellow-400' };
  }
  return { label: '消失の危険', color: 'text-red-600 dark:text-red-400' };
}

/** 活性化関数インタラクティブエクスプローラー */
export function ActivationFunctionExplorer() {
  const [activeId, setActiveId] = useState<ActivationId>('sigmoid');
  const [z, setZ] = useState(0);

  const info = INFOS.find((i) => i.id === activeId)!;
  const yRange = Y_RANGES[activeId];
  const fz = info.fn(z);
  const dfz = info.derivative(z);
  const gradientStatus = getGradientStatus(dfz, activeId);

  // SVG座標変換
  const toSvgX = (val: number) =>
    PADDING.left + ((val - Z_MIN) / (Z_MAX - Z_MIN)) * PLOT_W;
  const toSvgY = (val: number) =>
    PADDING.top + ((yRange.max - val) / (yRange.max - yRange.min)) * PLOT_H;

  // 曲線パス生成
  const curvePath = useMemo(() => {
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const zVal = Z_MIN + (i / steps) * (Z_MAX - Z_MIN);
      const yVal = info.fn(zVal);
      const x = toSvgX(zVal);
      const y = toSvgY(yVal);
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  }, [activeId]);

  // 導関数曲線パス
  const derivativePath = useMemo(() => {
    const steps = 200;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const zVal = Z_MIN + (i / steps) * (Z_MAX - Z_MIN);
      const yVal = info.derivative(zVal);
      const x = toSvgX(zVal);
      const y = toSvgY(yVal);
      points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  }, [activeId]);

  // 接線（現在点でのf'(z)を傾きとする短い線分）
  const tangentLen = 1.5;
  const tangentX1 = z - tangentLen;
  const tangentX2 = z + tangentLen;
  const tangentY1 = fz + dfz * (tangentX1 - z);
  const tangentY2 = fz + dfz * (tangentX2 - z);

  // 勾配ゾーン背景: |z|<2=緑, 2<|z|<4=黄, |z|>4=赤
  const vanishZones = [
    { x1: Z_MIN, x2: -4, color: 'rgba(239,68,68,0.08)' },
    { x1: -4, x2: -2, color: 'rgba(234,179,8,0.06)' },
    { x1: -2, x2: 2, color: 'rgba(34,197,94,0.08)' },
    { x1: 2, x2: 4, color: 'rgba(234,179,8,0.06)' },
    { x1: 4, x2: Z_MAX, color: 'rgba(239,68,68,0.08)' },
  ];

  return (
    <div className="space-y-3">
      {/* 切替ボタン */}
      <div className="flex gap-2">
        {INFOS.map((i) => (
          <button
            key={i.id}
            type="button"
            aria-pressed={activeId === i.id}
            onClick={() => setActiveId(i.id)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              activeId === i.id
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {i.name}
          </button>
        ))}
      </div>

      {/* SVGグラフ */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-lg"
        role="img"
        aria-label="活性化関数グラフ"
      >
        <defs>
          <clipPath id="activation-plot-clip">
            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={PLOT_W}
              height={PLOT_H}
            />
          </clipPath>
        </defs>

        {/* 勾配ゾーン背景（sigmoid/tanhのみ） */}
        {activeId !== 'relu' &&
          vanishZones.map((zone, i) => (
            <rect
              key={i}
              x={toSvgX(zone.x1)}
              y={PADDING.top}
              width={toSvgX(zone.x2) - toSvgX(zone.x1)}
              height={PLOT_H}
              fill={zone.color}
            />
          ))}

        {/* 軸 */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + PLOT_H}
          x2={PADDING.left + PLOT_W}
          y2={PADDING.top + PLOT_H}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + PLOT_H}
          stroke="currentColor"
          strokeOpacity={0.3}
        />

        {/* Y=0 ライン */}
        {yRange.min < 0 && (
          <line
            x1={PADDING.left}
            y1={toSvgY(0)}
            x2={PADDING.left + PLOT_W}
            y2={toSvgY(0)}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeDasharray="4,4"
          />
        )}

        {/* X=0 ライン */}
        <line
          x1={toSvgX(0)}
          y1={PADDING.top}
          x2={toSvgX(0)}
          y2={PADDING.top + PLOT_H}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4,4"
        />

        {/* 曲線（クリップ付き） */}
        <g clipPath="url(#activation-plot-clip)">
          {/* 関数曲線（実線） */}
          <path
            className="activation-curve"
            d={curvePath}
            fill="none"
            stroke="#6366F1"
            strokeWidth={2.5}
          />

          {/* 導関数曲線（破線） */}
          <path
            className="derivative-curve"
            d={derivativePath}
            fill="none"
            stroke="#F97316"
            strokeWidth={1.5}
            strokeDasharray="6,3"
          />

          {/* 接線（緑） */}
          <line
            x1={toSvgX(tangentX1)}
            y1={toSvgY(tangentY1)}
            x2={toSvgX(tangentX2)}
            y2={toSvgY(tangentY2)}
            stroke="#22C55E"
            strokeWidth={2}
            strokeOpacity={0.8}
          />
        </g>

        {/* 現在点 */}
        <circle
          cx={toSvgX(z)}
          cy={toSvgY(fz)}
          r={5}
          fill="#6366F1"
          stroke="white"
          strokeWidth={2}
        />

        {/* 軸ラベル */}
        <text
          x={PADDING.left + PLOT_W / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          z
        </text>
        <text
          x={12}
          y={PADDING.top + PLOT_H / 2}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${PADDING.top + PLOT_H / 2})`}
          className="text-xs fill-gray-500 dark:fill-gray-400"
        >
          f(z)
        </text>

        {/* 凡例 */}
        <g transform={`translate(${PADDING.left + 8}, ${PADDING.top + 12})`}>
          <line x1={0} y1={0} x2={16} y2={0} stroke="#6366F1" strokeWidth={2.5} />
          <text x={20} y={4} className="text-[10px] fill-gray-600 dark:fill-gray-300">
            f(z)
          </text>
          <line
            x1={0}
            y1={14}
            x2={16}
            y2={14}
            stroke="#F97316"
            strokeWidth={1.5}
            strokeDasharray="6,3"
          />
          <text x={20} y={18} className="text-[10px] fill-gray-600 dark:fill-gray-300">
            f&apos;(z)
          </text>
        </g>
      </svg>

      {/* zスライダー */}
      <ErrorCurveSlider
        label={`z = ${z.toFixed(2)}`}
        value={z}
        onChange={setZ}
        min={Z_MIN}
        max={Z_MAX}
        step={0.1}
      />

      {/* 値カード */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div
          data-testid="value-fz"
          className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20"
        >
          <div className="text-xs text-gray-500">f(z)</div>
          <div className="font-mono font-bold">{fz.toFixed(3)}</div>
        </div>
        <div
          data-testid="value-dfz"
          className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20"
        >
          <div className="text-xs text-gray-500">f&apos;(z)</div>
          <div className="font-mono font-bold">{dfz.toFixed(3)}</div>
        </div>
        <div
          data-testid="gradient-status"
          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
        >
          <div className="text-xs text-gray-500">勾配状態</div>
          <div className={`font-bold ${gradientStatus.color}`}>
            {gradientStatus.label}
          </div>
        </div>
      </div>

      {/* 数式カード */}
      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 text-sm">
        <div>
          <span className="text-xs text-gray-500 mr-2">関数:</span>
          <InlineKatex latex={info.formula} />
        </div>
        <div>
          <span className="text-xs text-gray-500 mr-2">導関数:</span>
          <InlineKatex latex={info.derivativeFormula} />
        </div>
        <div>
          <span className="text-xs text-gray-500 mr-2">出力範囲:</span>
          <span className="font-mono">{info.range}</span>
        </div>
        <div
          data-testid="key-point"
          className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200"
        >
          E資格ポイント: {info.keyPoint}
        </div>
      </div>
    </div>
  );
}
