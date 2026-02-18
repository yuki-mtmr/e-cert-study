'use client';

import {
  sigmoid,
  sigmoidDerivative,
  tanhActivation,
  tanhDerivative,
} from '@/lib/visual-explanations/activation-functions';
import { ActivationCurveChart } from './exam-hints/ActivationCurveChart';

// --- セクション1: 3関数の導関数比較表 ---

const COMPARISON_ROWS = [
  {
    name: 'Sigmoid',
    forward: 'out = σ(x)',
    backward: 'dout × out × (1-out)',
    saved: 'self.out',
  },
  {
    name: 'ReLU',
    forward: 'out = max(0, x)',
    backward: 'dout × (mask)',
    saved: 'self.mask',
  },
  {
    name: 'Tanh',
    forward: 'out = tanh(x)',
    backward: 'dout × (1-out²)',
    saved: 'self.out',
  },
];

function DerivativeComparisonTable() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. 3関数の導関数比較表</h3>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">関数</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">forward</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">backward (dx)</th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">保存値</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr
                key={row.name}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 font-medium text-xs">{row.name}</td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.forward}</td>
                <td className="px-2 py-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {row.backward}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs text-gray-500">
                  {row.saved}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- セクション2: Sigmoid曲線 ---

function SigmoidSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">2. Sigmoid: 関数と導関数</h3>
      <ActivationCurveChart
        fn={sigmoid}
        derivative={sigmoidDerivative}
        label="Sigmoid"
        xRange={[-6, 6]}
        yRange={[-0.1, 1.1]}
        annotation="最大値0.25（x=0）"
      />
      <div className="text-xs text-gray-600 dark:text-gray-400">
        σ&apos;(x) = σ(x)(1 - σ(x)) — 端で0に近づくため勾配消失が起きやすい
      </div>
    </section>
  );
}

// --- セクション3: ReLUマスク動作 ---

const RELU_INPUT = [2.5, -1.0, 0.3, -0.5];

function ReluMaskSection() {
  const mask = RELU_INPUT.map((v) => v <= 0);
  const forwardOut = RELU_INPUT.map((v) => Math.max(0, v));

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">3. ReLU: マスク動作の配列可視化</h3>

      <div className="overflow-x-auto">
        <div className="inline-grid grid-cols-5 gap-x-2 gap-y-1 text-xs font-mono">
          {/* ヘッダー */}
          <span className="font-semibold text-gray-500">行</span>
          {RELU_INPUT.map((_, i) => (
            <span key={i} className="text-center text-gray-400">[{i}]</span>
          ))}

          {/* x */}
          <span className="font-semibold">x</span>
          {RELU_INPUT.map((v, i) => (
            <span
              key={i}
              className={`text-center px-1.5 py-0.5 rounded ${
                v <= 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {v.toFixed(1)}
            </span>
          ))}

          {/* mask */}
          <span className="font-semibold">mask</span>
          {mask.map((m, i) => (
            <span
              key={i}
              className={`text-center px-1.5 py-0.5 rounded ${
                m ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {m ? 'T' : 'F'}
            </span>
          ))}

          {/* forward */}
          <span className="font-semibold">fwd</span>
          {forwardOut.map((v, i) => (
            <span
              key={i}
              className={`text-center px-1.5 py-0.5 rounded ${
                v === 0 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {v.toFixed(1)}
            </span>
          ))}

          {/* backward */}
          <span className="font-semibold">bwd</span>
          {mask.map((m, i) => (
            <span
              key={i}
              className={`text-center px-1.5 py-0.5 rounded ${
                m ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {m ? '0' : 'dout'}
            </span>
          ))}
        </div>
      </div>

      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
        mask=True(x≤0)の位置は forward=0, backward=0
      </div>
    </section>
  );
}

// --- セクション4: Tanh曲線 ---

function TanhSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">4. Tanh: 関数と導関数</h3>
      <ActivationCurveChart
        fn={tanhActivation}
        derivative={tanhDerivative}
        label="Tanh"
        xRange={[-6, 6]}
        yRange={[-1.2, 1.2]}
        annotation="最大値1.0（x=0）"
      />
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Sigmoidとの違い — Sigmoid: out(1-out), Tanh: 1-out²
      </div>
    </section>
  );
}

// --- 親コンポーネント ---

/** 活性化関数の逆伝播をビジュアルで整理する解説コンポーネント */
export function ActivationBackwardExplanation() {
  return (
    <div className="space-y-8">
      <DerivativeComparisonTable />
      <SigmoidSection />
      <ReluMaskSection />
      <TanhSection />

    </div>
  );
}
