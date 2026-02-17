'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  generateDots,
  computeCentroid,
  computeVarianceRadius,
  computeNoiseOffset,
} from '@/lib/visual-explanations/bias-variance';
import { ErrorCurveSlider } from './ErrorCurveSlider';

const DOT_COUNT = 15;
const SIZE = 200;
const CENTER = SIZE / 2;
const RINGS = [80, 55, 30];

/** 座標(-1~1)をSVG座標に変換 */
function toSvg(val: number): number {
  return CENTER + val * (RINGS[0] - 5);
}

/** インタラクティブ的（スライダー2本+再サンプル+ノイズ） */
export function InteractiveTarget() {
  const [bias, setBias] = useState(0.3);
  const [variance, setVariance] = useState(0.3);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [noiseAmplitude, setNoiseAmplitude] = useState(0.2);
  const [sampleKey, setSampleKey] = useState(0);

  const dots = useMemo(
    () => generateDots(DOT_COUNT, bias, bias, variance),
    // sampleKey変更でドットを再生成
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bias, variance, sampleKey],
  );

  const centroid = useMemo(() => computeCentroid(dots), [dots]);
  const varianceRadius = useMemo(
    () => computeVarianceRadius(dots, centroid),
    [dots, centroid],
  );

  const noiseOffset = useMemo(
    () => (noiseEnabled ? computeNoiseOffset(sampleKey * 0.7, noiseAmplitude) : { dx: 0, dy: 0 }),
    [noiseEnabled, noiseAmplitude, sampleKey],
  );

  const handleResample = useCallback(() => {
    setSampleKey((k) => k + 1);
  }, []);

  // bullseye中心のSVG座標（ノイズで揺れる）
  const bullseyeX = toSvg(noiseOffset.dx);
  const bullseyeY = toSvg(noiseOffset.dy);
  const centroidX = toSvg(centroid.x + noiseOffset.dx);
  const centroidY = toSvg(centroid.y + noiseOffset.dy);
  const varRadiusSvg = varianceRadius * (RINGS[0] - 5);

  return (
    <div data-testid="interactive-target" className="space-y-3">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[280px] mx-auto"
        role="img"
        aria-label="インタラクティブなバイアス-バリアンスターゲット"
      >
        {/* 同心円 */}
        {RINGS.map((r) => (
          <circle
            key={r}
            cx={bullseyeX}
            cy={bullseyeY}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-gray-300 dark:text-gray-600"
            strokeWidth={1}
          />
        ))}
        {/* bullseye中心（緑） */}
        <circle cx={bullseyeX} cy={bullseyeY} r={3} className="fill-emerald-500" />

        {/* バリアンス円（青半透明） */}
        <circle
          cx={centroidX}
          cy={centroidY}
          r={varRadiusSvg}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="#3B82F6"
          strokeWidth={1}
          strokeDasharray="4 2"
        />

        {/* バイアス線（重心→中心, 紫点線） */}
        <line
          data-testid="bias-line"
          x1={centroidX}
          y1={centroidY}
          x2={bullseyeX}
          y2={bullseyeY}
          stroke="#8B5CF6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* ドット群 */}
        {dots.map((dot, i) => (
          <circle
            key={i}
            data-testid="target-dot"
            cx={toSvg(dot.x + noiseOffset.dx)}
            cy={toSvg(dot.y + noiseOffset.dy)}
            r={3}
            className="fill-red-500"
            opacity={0.8}
          />
        ))}

        {/* 重心×印（青） */}
        <g data-testid="centroid-mark">
          <line
            x1={centroidX - 5}
            y1={centroidY - 5}
            x2={centroidX + 5}
            y2={centroidY + 5}
            stroke="#3B82F6"
            strokeWidth={2}
          />
          <line
            x1={centroidX + 5}
            y1={centroidY - 5}
            x2={centroidX - 5}
            y2={centroidY + 5}
            stroke="#3B82F6"
            strokeWidth={2}
          />
        </g>
      </svg>

      {/* コントロール */}
      <div className="space-y-2 max-w-[320px] mx-auto">
        <ErrorCurveSlider label="バイアス" value={bias} onChange={setBias} />
        <ErrorCurveSlider label="バリアンス" value={variance} onChange={setVariance} />

        <div className="flex items-center gap-3">
          <button
            onClick={handleResample}
            className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            再サンプル
          </button>
          <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={noiseEnabled}
              onChange={(e) => setNoiseEnabled(e.target.checked)}
            />
            ノイズ
          </label>
        </div>

        {noiseEnabled && (
          <ErrorCurveSlider label="ノイズ振幅" value={noiseAmplitude} onChange={setNoiseAmplitude} />
        )}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 justify-center text-[10px] text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          的の中心
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          予測（弾痕）
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          重心
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0 border-t-2 border-dashed border-violet-500" />
          バイアス
        </span>
      </div>
    </div>
  );
}
