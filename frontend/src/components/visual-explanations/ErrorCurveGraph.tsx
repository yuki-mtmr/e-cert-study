'use client';

import { CapacityErrorGraph } from './CapacityErrorGraph';
import { DataSizeErrorGraph } from './DataSizeErrorGraph';

/** 訓練誤差・汎化誤差のインタラクティブグラフ（図1+図2） */
export function ErrorCurveGraph() {
  return (
    <div className="space-y-8">
      <section>
        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          図1: モデル容量と誤差
        </h5>
        <CapacityErrorGraph />
      </section>
      <section>
        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          図2: 学習データ量と誤差
        </h5>
        <DataSizeErrorGraph />
      </section>
    </div>
  );
}
