'use client';

import { MomentumUpdateSection } from './optimizer/MomentumUpdateSection';
import { NagLookaheadSection } from './optimizer/NagLookaheadSection';
import { PathologicalCurvatureSection } from './optimizer/PathologicalCurvatureSection';
import { SummarySection } from './optimizer/SummarySection';

/** Optimizer（Momentum / NAG / Pathological Curvature）のビジュアル解説 */
export function OptimizerExplanation() {
  return (
    <div className="space-y-8">
      <MomentumUpdateSection />
      <NagLookaheadSection />
      <PathologicalCurvatureSection />
      <SummarySection />
    </div>
  );
}
