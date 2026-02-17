'use client';

import { useState, useMemo } from 'react';
import { computeAp } from '@/lib/visual-explanations/roc-pr-curves';
import { ErrorCurveSlider } from './ErrorCurveSlider';

interface ClassDef {
  name: string;
  dPrime: number;
  positiveRate: number;
}

const CLASSES: ClassDef[] = [
  { name: '犬', dPrime: 2.5, positiveRate: 0.4 },
  { name: '猫', dPrime: 2.0, positiveRate: 0.35 },
  { name: '鳥', dPrime: 1.5, positiveRate: 0.25 },
];

/** セクション3: AP / mAP の解説 */
export function ApMapExplanation() {
  const [dPrimeScale, setDPrimeScale] = useState(1.0);

  const classAPs = useMemo(
    () =>
      CLASSES.map((c) => ({
        name: c.name,
        ap: computeAp(c.dPrime * dPrimeScale, c.positiveRate),
      })),
    [dPrimeScale],
  );

  const mAP = useMemo(
    () => classAPs.reduce((sum, c) => sum + c.ap, 0) / classAPs.length,
    [classAPs],
  );

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        AP (Average Precision) と mAP
      </h3>

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>
          <strong>AP</strong> は1クラスのPR曲線下面積。
          <strong>mAP</strong> は全クラスのAPの平均。
        </p>
      </div>

      {/* 各クラスのAP */}
      <div className="grid grid-cols-3 gap-3">
        {classAPs.map((c) => (
          <div
            key={c.name}
            data-testid="class-ap"
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {c.name}
            </div>
            <div className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
              {c.ap.toFixed(3)}
            </div>
            <div className="text-xs text-gray-400">AP</div>
          </div>
        ))}
      </div>

      {/* mAP */}
      <div
        data-testid="map-value"
        className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center"
      >
        <div className="text-sm text-gray-600 dark:text-gray-400">
          mAP = ({classAPs.map((c) => c.ap.toFixed(3)).join(' + ')}) / {classAPs.length}
        </div>
        <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
          mAP = {mAP.toFixed(3)}
        </div>
      </div>

      {/* スライダー */}
      <ErrorCurveSlider
        label={`分離度 (d'スケール): ${dPrimeScale.toFixed(1)}x`}
        value={dPrimeScale}
        onChange={setDPrimeScale}
        min={0.1}
        max={2.0}
        step={0.1}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        d&apos;を大きくすると陽性・陰性の分離が良くなるため、各クラスのAPが上昇し、結果としてmAPも向上する。
      </p>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        mAP は物体検出タスクで最も一般的な総合指標。各クラスのAPを平均する。
      </p>
    </section>
  );
}
