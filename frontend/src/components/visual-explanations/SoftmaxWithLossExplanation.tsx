'use client';

import { AxisKeepdims } from './softmax/AxisKeepdims';
import { CrossEntropySteps } from './softmax/CrossEntropySteps';
import { ForwardBackwardFlow } from './softmax/ForwardBackwardFlow';
import { GradientBarChart } from './softmax/GradientBarChart';

/** SoftmaxWithLossの背景知識をビジュアルで整理する解説コンポーネント */
export function SoftmaxWithLossExplanation() {
  return (
    <div className="space-y-8">
      <AxisKeepdims />
      <CrossEntropySteps />
      <ForwardBackwardFlow />
      <GradientBarChart />
    </div>
  );
}
