'use client';

import { useState, useMemo } from 'react';
import {
  computeAxisDemo,
  softmax1D,
  crossEntropyLoss,
  computeGradient,
  PIPELINE_COLORS,
} from '@/lib/visual-explanations/softmax-cross-entropy';
import { ExamQ4SoftmaxLoss } from './ExamQ4SoftmaxLoss';

type Axis = 0 | 1;

// --- セクション1: axis/keepdimsの行列操作図 ---

function AxisKeepdims() {
  const [axis, setAxis] = useState<Axis>(1);
  const demo = useMemo(() => computeAxisDemo(), []);

  const maxResult = axis === 0 ? demo.maxAxis0 : demo.maxAxis1;
  const maxShape = axis === 0 ? `(${demo.original[0].length},)` : `(${demo.original.length},)`;
  const keepdimsShape =
    axis === 0
      ? `(1, ${demo.original[0].length})`
      : `(${demo.original.length}, 1)`;

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. axis/keepdimsの行列操作</h3>

      {/* トグルボタン */}
      <div className="flex gap-2">
        {([0, 1] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={axis === a}
            onClick={() => setAxis(a)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              axis === a
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            axis={a}{a === 0 ? '（列↓）' : '（行→）'}
          </button>
        ))}
      </div>

      {/* 元の行列 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          元の行列 ({demo.original.length}×{demo.original[0].length})
        </div>
        <MatrixGrid data={demo.original} />
      </div>

      {/* max結果 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          np.max(x, axis={axis}) → 形状 {maxShape}
        </div>
        <div className="flex gap-1">
          {maxResult.map((v, i) => (
            <Cell key={i} value={v} highlight />
          ))}
        </div>
      </div>

      {/* keepdims */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500">
          keepdims=True → 形状 {keepdimsShape}
        </div>
        {axis === 1 && <MatrixGrid data={demo.keepdimsAxis1} highlight />}
      </div>

      {/* ブロードキャスト引き算結果 */}
      {axis === 1 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">x - max(axis=1, keepdims=True)</div>
          <MatrixGrid data={demo.subtracted} />
        </div>
      )}

      {/* 要点ボックス */}
      <KeyPoint text="axis=1, keepdims=True → 形状保持でブロードキャスト可能" />
    </section>
  );
}

// --- セクション2: クロスエントロピー計算のステップ図 ---

const SAMPLE_LOGITS = [
  [2.0, 1.0, 0.1],
  [1.0, 3.0, 0.2],
  [0.5, 0.3, 2.5],
];
const TEACHER_LABELS = [0, 2, 1];

function CrossEntropySteps() {
  const softmaxRows = useMemo(
    () => SAMPLE_LOGITS.map((row) => softmax1D(row)),
    [],
  );
  const losses = useMemo(
    () => softmaxRows.map((row, i) => crossEntropyLoss(row, TEACHER_LABELS[i])),
    [softmaxRows],
  );
  const avgLoss = useMemo(
    () => losses.reduce((a, b) => a + b, 0) / losses.length,
    [losses],
  );

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">2. クロスエントロピー計算ステップ</h3>

      {/* softmax出力テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-xs text-gray-500">sample</th>
              {[0, 1, 2].map((c) => (
                <th key={c} className="px-2 py-1 text-xs text-gray-500">class {c}</th>
              ))}
              <th className="px-2 py-1 text-xs text-gray-500">-log(p)</th>
            </tr>
          </thead>
          <tbody>
            {softmaxRows.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-1 font-mono text-xs">t={TEACHER_LABELS[i]}</td>
                {row.map((v, c) => (
                  <td
                    key={c}
                    className={`px-2 py-1 font-mono text-xs ${
                      c === TEACHER_LABELS[i]
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 font-bold'
                        : ''
                    }`}
                  >
                    {v.toFixed(3)}
                  </td>
                ))}
                <td className="px-2 py-1 font-mono text-xs text-red-600 dark:text-red-400">
                  {losses[i].toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm font-mono">
        Loss = mean = <span className="font-bold">{avgLoss.toFixed(3)}</span>
      </div>

      <KeyPoint text="np.arange(N)とtで各サンプルの正解クラス確率だけを取得" />
    </section>
  );
}

// --- セクション3: Forward/Backwardフロー図 ---

function ForwardBackwardFlow() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">3. Forward/Backwardフロー</h3>

      {/* Forward */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">Forward</div>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <FlowBox label="x" color={PIPELINE_COLORS.input.hex} />
          <Arrow />
          <FlowBox label="softmax" color={PIPELINE_COLORS.softmax.hex} />
          <Arrow />
          <FlowBox label="self.y" color={PIPELINE_COLORS.softmax.hex} highlight />
          <Arrow />
          <FlowBox label="CE(self.y, self.t)" color={PIPELINE_COLORS.loss.hex} />
          <Arrow />
          <FlowBox label="loss" color={PIPELINE_COLORS.loss.hex} />
        </div>
      </div>

      {/* Backward */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">Backward</div>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <FlowBox label="dout=1" color={PIPELINE_COLORS.gradient.hex} />
          <Arrow />
          <FlowBox
            label="dx = (self.y - self.t) / N"
            color={PIPELINE_COLORS.gradient.hex}
          />
        </div>
      </div>

      <KeyPoint text="forwardで保存した y, t をbackwardで再利用" />
    </section>
  );
}

// --- セクション4: 勾配バーチャート ---

const GRADIENT_LOGITS = [2.0, 1.0, 0.1];
const GRADIENT_TEACHER = 0;

function GradientBarChart() {
  const y = useMemo(() => softmax1D(GRADIENT_LOGITS), []);
  const bars = useMemo(() => computeGradient(y, GRADIENT_TEACHER, 1), [y]);

  const maxAbs = Math.max(...bars.map((b) => Math.max(Math.abs(b.yValue), Math.abs(b.dxValue))));
  const W = 300;
  const H = 160;
  const barW = 20;
  const gap = 60;
  const baseY = H * 0.6;

  const scale = (v: number) => (v / (maxAbs * 1.2)) * (H * 0.5);

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">4. 勾配バーチャート</h3>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img" aria-label="勾配バーチャート">
        {/* 0ライン */}
        <line x1={20} y1={baseY} x2={W - 10} y2={baseY} stroke="currentColor" strokeOpacity={0.2} />

        {bars.map((bar, i) => {
          const cx = 50 + i * gap;
          const yH = scale(bar.yValue);
          const tH = scale(bar.tValue);
          const dxH = scale(bar.dxValue);

          return (
            <g key={i}>
              {/* y (青) */}
              <rect
                x={cx - barW * 1.5}
                y={baseY - yH}
                width={barW}
                height={Math.abs(yH)}
                fill={PIPELINE_COLORS.softmax.hex}
                opacity={0.8}
              />
              {/* t (緑) */}
              <rect
                x={cx - barW * 0.25}
                y={baseY - tH}
                width={barW}
                height={Math.abs(tH)}
                fill={PIPELINE_COLORS.teacher.hex}
                opacity={0.8}
              />
              {/* (y-t)/N (オレンジ) */}
              <rect
                x={cx + barW}
                y={dxH >= 0 ? baseY - dxH : baseY}
                width={barW}
                height={Math.abs(dxH)}
                fill={PIPELINE_COLORS.gradient.hex}
                opacity={0.8}
              />
              {/* ラベル */}
              <text
                x={cx}
                y={H - 4}
                textAnchor="middle"
                className="text-[10px] fill-gray-600 dark:fill-gray-300"
              >
                {bar.label}
              </text>
            </g>
          );
        })}

        {/* 凡例 */}
        <g transform="translate(10, 10)" className="text-[9px]">
          <rect width={10} height={10} fill={PIPELINE_COLORS.softmax.hex} opacity={0.8} />
          <text x={14} y={9} className="fill-gray-600 dark:fill-gray-300">y</text>
          <rect y={14} width={10} height={10} fill={PIPELINE_COLORS.teacher.hex} opacity={0.8} />
          <text x={14} y={23} className="fill-gray-600 dark:fill-gray-300">t</text>
          <rect y={28} width={10} height={10} fill={PIPELINE_COLORS.gradient.hex} opacity={0.8} />
          <text x={14} y={37} className="fill-gray-600 dark:fill-gray-300">(y-t)/N</text>
        </g>
      </svg>

      <KeyPoint text="(y-t)/N — 予測が正解に近いほど勾配が小さい" />
    </section>
  );
}

// --- 共通小部品 ---

function MatrixGrid({
  data,
  highlight,
}: {
  data: number[][];
  highlight?: boolean;
}) {
  return (
    <div className="inline-flex flex-col gap-0.5">
      {data.map((row, r) => (
        <div key={r} className="flex gap-0.5">
          {row.map((v, c) => (
            <Cell key={c} value={v} highlight={highlight} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Cell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={`inline-block w-12 text-center font-mono text-xs py-0.5 rounded ${
        highlight
          ? 'bg-indigo-100 dark:bg-indigo-900/30'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}
    >
      {value.toFixed(1)}
    </span>
  );
}

function FlowBox({
  label,
  color,
  highlight,
}: {
  label: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-mono border ${
        highlight ? 'ring-2 ring-offset-1' : ''
      }`}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-gray-400">→</span>;
}

function KeyPoint({ text }: { text: string }) {
  return (
    <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
      {text}
    </div>
  );
}

// --- 親コンポーネント ---

/** SoftmaxWithLossの背景知識をビジュアルで整理する解説コンポーネント */
export function SoftmaxWithLossExplanation() {
  return (
    <div className="space-y-8">
      <AxisKeepdims />
      <CrossEntropySteps />
      <ForwardBackwardFlow />
      <GradientBarChart />

      {/* 末尾: 4択問題（小さく） */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <details>
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            4択問題で確認する
          </summary>
          <div className="mt-3">
            <ExamQ4SoftmaxLoss />
          </div>
        </details>
      </div>
    </div>
  );
}
