'use client';

import katex from 'katex';
import {
  getTaskCombos,
  getOrdinalThresholds,
} from '@/lib/visual-explanations/loss-activation-combos';

const COMBOS = getTaskCombos();
const THRESHOLDS = getOrdinalThresholds(5);

/** 活性化関数・損失関数を inline KaTeX で描画 */
function InlineKatex({ latex }: { latex: string }) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: false,
  });
  return (
    <span
      className="inline-block"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** 損失関数×活性化関数の組み合わせガイド */
export function LossActivationGuide() {
  return (
    <div className="space-y-6">
      {/* 組み合わせ比較表 */}
      <section>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
          タスク別：活性化関数 × 損失関数の正しい組み合わせ
        </h4>
        <div className="space-y-2">
          {COMBOS.map((c) => (
            <div
              key={c.id}
              data-testid="task-row"
              className={`p-3 rounded-lg border space-y-1.5 ${
                c.id === 'ordinal'
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {c.taskName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {c.example}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    出力:
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {c.outputShape}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    活性化:
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {c.activation}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    損失:
                  </span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {c.loss}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-xs flex-wrap">
                <div>
                  <InlineKatex latex={c.latexActivation} />
                </div>
                <div>
                  <InlineKatex latex={c.latexLoss} />
                </div>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {c.keyPoint}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 多クラス vs マルチラベルの違い */}
      <section data-testid="multiclass-vs-multilabel">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          多クラス vs マルチラベル：何が違う？
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 space-y-1">
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
              多クラス分類
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              1サンプル → <span className="font-bold">1つだけ</span>のラベル
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              例：この画像は「犬」か「猫」か「鳥」か → 1つに決まる
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              → 確率の合計 = 1（ソフトマックスで排他的）
            </div>
          </div>
          <div className="p-3 rounded-lg border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 space-y-1">
            <div className="text-sm font-bold text-violet-700 dark:text-violet-300">
              マルチラベル分類
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              1サンプル → <span className="font-bold">複数</span>のラベル可
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              例：この映画は「アクション」でもあり「コメディ」でもある
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              → 各ラベルが独立（シグモイドで個別に0〜1）
            </div>
          </div>
        </div>
      </section>

      {/* 順序回帰の累積確率アプローチ */}
      <section data-testid="ordinal-explanation">
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          順序回帰はなぜシグモイド＋バイナリCE？
        </h4>
        <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 space-y-3">
          <div className="text-xs text-gray-700 dark:text-gray-300">
            ★1〜★5のレビュー評価を考えます。順序回帰では
            <span className="font-bold">各閾値を独立した2値分類</span>
            に分解します：
          </div>
          <div className="flex flex-wrap gap-2">
            {THRESHOLDS.map((t) => (
              <div
                key={t.thresholdValue}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 text-xs"
              >
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {t.label}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {t.description}
                </span>
                <span className="text-blue-600 dark:text-blue-400">
                  → σ(z)
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <div>
              ★3の評価なら：
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                P(≥2)=1, P(≥3)=1, P(≥4)=0, P(≥5)=0
              </span>
            </div>
            <div className="font-bold text-amber-700 dark:text-amber-300">
              → 4つの独立した2値分類 → シグモイド × バイナリクロスエントロピー
            </div>
            <div>
              順序関係が自然に保たれる：P(≥2) ≥ P(≥3) ≥ P(≥4) ≥ P(≥5)
            </div>
          </div>
        </div>
      </section>

      {/* よくある誤解 */}
      <section>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
          よくある誤解
        </h4>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
            <span className="font-bold text-red-600 dark:text-red-400">
              ✗
            </span>{' '}
            <span className="text-gray-700 dark:text-gray-300">
              「3つ以上のクラスがある → ソフトマックス」は<span className="font-bold">常に正しいわけではない</span>
            </span>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              マルチラベルや順序回帰のように、各出力が独立な場合はシグモイドが正解
            </div>
          </div>
          <div className="p-2.5 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
            <span className="font-bold text-red-600 dark:text-red-400">
              ✗
            </span>{' '}
            <span className="text-gray-700 dark:text-gray-300">
              「ソフトマックス＋バイナリクロスエントロピー」の組み合わせは
              <span className="font-bold">基本的に使わない</span>
            </span>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              ソフトマックスは排他的確率分布 → カテゴリカルCEとセット。バイナリCEは各出力が独立な場合に使う
            </div>
          </div>
          <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              ✓ 見分け方
            </span>{' '}
            <span className="text-gray-700 dark:text-gray-300">
              出力が<span className="font-bold">排他的</span>（1つだけ選ぶ）→ ソフトマックス＋CE
            </span>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              出力が<span className="font-bold">独立</span>（各出力が個別に0/1）→ シグモイド＋BCE
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
