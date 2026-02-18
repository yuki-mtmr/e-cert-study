import { useMemo } from 'react';

const WIDTH = 360;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

interface ActivationCurveChartProps {
  fn: (x: number) => number;
  derivative: (x: number) => number;
  label: string;
  xRange?: [number, number];
  yRange?: [number, number];
  annotation?: string;
}

/** 関数と導関数の静的SVGグラフ（凡例付き） */
export function ActivationCurveChart({
  fn,
  derivative,
  label,
  xRange = [-6, 6],
  yRange = [-0.2, 1.2],
  annotation,
}: ActivationCurveChartProps) {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  const toSvgX = (v: number) => PAD.left + ((v - xMin) / (xMax - xMin)) * PLOT_W;
  const toSvgY = (v: number) => PAD.top + ((yMax - v) / (yMax - yMin)) * PLOT_H;

  const buildPath = (f: (x: number) => number) => {
    const steps = 200;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = f(x);
      // SVG座標をプロット領域内にクランプ
      const sy = Math.max(PAD.top, Math.min(PAD.top + PLOT_H, toSvgY(y)));
      pts.push(`${i === 0 ? 'M' : 'L'}${toSvgX(x).toFixed(1)},${sy.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const fnPath = useMemo(() => buildPath(fn), [fn, xMin, xMax, yMin, yMax]);
  const derivPath = useMemo(() => buildPath(derivative), [derivative, xMin, xMax, yMin, yMax]);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full max-w-sm"
      role="img"
      aria-label={`${label} の関数と導関数グラフ`}
    >
      <defs>
        <clipPath id={`clip-${label}`}>
          <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
        </clipPath>
      </defs>

      {/* 軸 */}
      <line
        x1={PAD.left} y1={PAD.top + PLOT_H}
        x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H}
        stroke="currentColor" strokeOpacity={0.3}
      />
      <line
        x1={PAD.left} y1={PAD.top}
        x2={PAD.left} y2={PAD.top + PLOT_H}
        stroke="currentColor" strokeOpacity={0.3}
      />

      {/* Y=0 基準線 */}
      {yMin < 0 && (
        <line
          x1={PAD.left} y1={toSvgY(0)}
          x2={PAD.left + PLOT_W} y2={toSvgY(0)}
          stroke="currentColor" strokeOpacity={0.15} strokeDasharray="4,4"
        />
      )}

      {/* 曲線 */}
      <g clipPath={`url(#clip-${label})`}>
        <path d={fnPath} fill="none" stroke="#6366F1" strokeWidth={2.5} />
        <path d={derivPath} fill="none" stroke="#F97316" strokeWidth={1.5} strokeDasharray="6,3" />
      </g>

      {/* 凡例 */}
      <g transform={`translate(${PAD.left + 8}, ${PAD.top + 10})`}>
        <line x1={0} y1={0} x2={14} y2={0} stroke="#6366F1" strokeWidth={2.5} />
        <text x={18} y={4} className="text-[10px] fill-gray-600 dark:fill-gray-300">f(x)</text>
        <line x1={0} y1={14} x2={14} y2={14} stroke="#F97316" strokeWidth={1.5} strokeDasharray="6,3" />
        <text x={18} y={18} className="text-[10px] fill-gray-600 dark:fill-gray-300">f&apos;(x)</text>
      </g>

      {/* 軸ラベル */}
      <text
        x={PAD.left + PLOT_W / 2} y={HEIGHT - 4}
        textAnchor="middle"
        className="text-xs fill-gray-500 dark:fill-gray-400"
      >
        x
      </text>

      {/* 注釈 */}
      {annotation && (
        <text
          x={PAD.left + PLOT_W - 4} y={PAD.top + 12}
          textAnchor="end"
          className="text-[9px] fill-gray-500 dark:fill-gray-400"
        >
          {annotation}
        </text>
      )}
    </svg>
  );
}
