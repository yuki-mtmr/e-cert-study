'use client';

import { ShootingTargetSection } from './ShootingTargetSection';
import { FormulaDecomposition } from './FormulaDecomposition';
import { QuickReferenceSection } from './QuickReferenceSection';

/** バイアス-バリアンス-ノイズ分解の親コンポーネント（3セクション結合） */
export function BiasVarianceExplanation() {
  return (
    <div className="space-y-8">
      <ShootingTargetSection />
      <FormulaDecomposition />
      <QuickReferenceSection />
    </div>
  );
}
