'use client';

import { getStaticScenarios } from '@/lib/visual-explanations/bias-variance';
import { StaticTarget } from './StaticTarget';
import { InteractiveTarget } from './InteractiveTarget';

/** セクション1: 射撃アナロジー（静的4つ + インタラクティブ1つ） */
export function ShootingTargetSection() {
  const scenarios = getStaticScenarios();

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        射撃アナロジーで理解する
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        モデルの予測を「的に弾を撃つ」ことにたとえると、バイアスは「狙いのズレ」、バリアンスは「弾の散らばり」に対応します。
      </p>

      {/* 4つの静的ターゲット */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {scenarios.map((s) => (
          <StaticTarget key={s.id} scenario={s} />
        ))}
      </div>

      {/* インタラクティブターゲット */}
      <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          自分で試してみよう
        </h4>
        <InteractiveTarget />
      </div>
    </section>
  );
}
