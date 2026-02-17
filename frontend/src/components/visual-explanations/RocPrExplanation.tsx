'use client';

import { RocCurveSection } from './RocCurveSection';
import { RocPrComparison } from './RocPrComparison';
import { ApMapExplanation } from './ApMapExplanation';
import { ModelComparison } from './ModelComparison';

/** ROC曲線・PR曲線とAUC/AP の親コンポーネント（4セクション結合） */
export function RocPrExplanation() {
  return (
    <div className="space-y-8">
      <RocCurveSection />
      <RocPrComparison />
      <ApMapExplanation />
      <ModelComparison />
    </div>
  );
}
