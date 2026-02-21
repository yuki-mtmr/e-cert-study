'use client';

import { PIPELINE_COLORS } from '@/lib/visual-explanations/softmax-cross-entropy';
import { FlowBox, Arrow, KeyPoint } from './shared';

export function ForwardBackwardFlow() {
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
