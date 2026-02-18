'use client';

import {
  OPTIMIZER_COLORS,
  generateSgdPath,
  generateMomentumPath,
  toPolylinePoints,
} from '@/lib/visual-explanations/optimizer-momentum';
import { ExamQ8Optimizer } from './ExamQ8Optimizer';

// --- ヘルパーコンポーネント ---

function FlowBox({
  label,
  color,
  highlight,
}: {
  label: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-mono border ${
        highlight ? 'ring-2 ring-offset-1' : ''
      }`}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return <span className="text-gray-400">→</span>;
}

// --- セクション1: Momentum更新式の符号追跡 ---

const ELIMINATION_ROWS = [
  { label: 'A', formula: 'γv - η∇J', reason: '符号がマイナス（v内部はプラスが正しい）', correct: false },
  { label: 'B', formula: 'γv + η∇J', reason: 'γ(~0.9)→v, η(~0.01)→∇J で正しい', correct: true },
  { label: 'C', formula: 'ηv + γ∇J', reason: 'γとηの位置が逆', correct: false },
  { label: 'D', formula: 'ηv - γ∇J', reason: 'γとηの位置が逆＋符号もマイナス', correct: false },
];

function MomentumUpdateSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">1. Momentum更新式の符号追跡</h3>

      {/* フロー図 */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500">
          パラメータ更新の流れ
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <FlowBox label="θ" color="#6366F1" />
          <Arrow />
          <FlowBox label="θ - v_t" color="#6366F1" />
          <Arrow />
          <FlowBox label="v_t" color={OPTIMIZER_COLORS.momentum} highlight />
          <span className="text-xs text-gray-500">=</span>
          <FlowBox label="γv_{t-1} + η∇J" color={OPTIMIZER_COLORS.momentum} />
        </div>
      </div>

      {/* 消去法テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                選択肢
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                式
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                理由
              </th>
            </tr>
          </thead>
          <tbody>
            {ELIMINATION_ROWS.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  row.correct
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : ''
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.label}
                  {row.correct && (
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      ✓
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.formula}
                </td>
                <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 判別のコツ */}
      <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
        γ(~0.9)はv_{'{t-1}'}に、η(~0.01)は∇Jに。この大小関係で即判別
      </div>
    </section>
  );
}

// --- セクション2: NAG先読みの仕組み ---

const NAG_COMPARISON_ROWS = [
  {
    aspect: '速度更新式',
    momentum: 'v = γv + η∇J(θ)',
    nag: 'v = γv + η∇J(θ - γv)',
  },
  {
    aspect: '勾配評価位置',
    momentum: '現在位置 θ',
    nag: '先読み位置 θ - γv',
  },
  {
    aspect: '利点',
    momentum: '振動抑制・加速',
    nag: '過剰更新を先読みで抑制',
  },
];

function NagLookaheadSection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">2. NAG先読みの仕組み</h3>

      {/* SVG等高線図 */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-md" role="img">
          <title>NAG先読み図</title>
          {/* 等高線（楕円） */}
          <ellipse
            cx="200"
            cy="100"
            rx="90"
            ry="50"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />
          <ellipse
            cx="200"
            cy="100"
            rx="60"
            ry="30"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />
          <ellipse
            cx="200"
            cy="100"
            rx="30"
            ry="12"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="1"
          />

          {/* 現在位置 θ (blue) */}
          <circle
            cx="120"
            cy="80"
            r="6"
            fill={OPTIMIZER_COLORS.currentPos}
          />
          <text
            x="106"
            y="72"
            fontSize="12"
            fill={OPTIMIZER_COLORS.currentPos}
            fontWeight="bold"
          >
            θ
          </text>

          {/* 先読み位置 θ-γv (amber) */}
          <circle
            cx="175"
            cy="90"
            r="6"
            fill={OPTIMIZER_COLORS.lookAhead}
          />
          <text
            x="155"
            y="82"
            fontSize="11"
            fill={OPTIMIZER_COLORS.lookAhead}
            fontWeight="bold"
          >
            θ−γv
          </text>

          {/* 矢印: θ → θ-γv */}
          <line
            x1="126"
            y1="80"
            x2="168"
            y2="90"
            stroke={OPTIMIZER_COLORS.lookAhead}
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />

          {/* Momentum勾配 (blue矢印: θから下向き) */}
          <line
            x1="120"
            y1="86"
            x2="120"
            y2="120"
            stroke={OPTIMIZER_COLORS.currentPos}
            strokeWidth="2"
            markerEnd="url(#arrowBlue)"
          />
          <text
            x="80"
            y="115"
            fontSize="10"
            fill={OPTIMIZER_COLORS.currentPos}
          >
            ∇J(θ)
          </text>

          {/* NAG勾配 (amber矢印: θ-γvから下向き) */}
          <line
            x1="175"
            y1="96"
            x2="190"
            y2="105"
            stroke={OPTIMIZER_COLORS.lookAhead}
            strokeWidth="2"
            markerEnd="url(#arrowAmber)"
          />
          <text
            x="192"
            y="108"
            fontSize="10"
            fill={OPTIMIZER_COLORS.lookAhead}
          >
            ∇J(θ−γv)
          </text>

          {/* 矢印マーカー定義 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.lookAhead}
              />
            </marker>
            <marker
              id="arrowBlue"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.currentPos}
              />
            </marker>
            <marker
              id="arrowAmber"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <polygon
                points="0 0, 6 2, 0 4"
                fill={OPTIMIZER_COLORS.lookAhead}
              />
            </marker>
          </defs>
        </svg>
      </div>

      {/* Momentum vs NAG 比較テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500" />
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                Momentum
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                NAG
              </th>
            </tr>
          </thead>
          <tbody>
            {NAG_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.aspect}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {row.aspect}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.momentum}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.nag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 即答ポイント */}
      <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200">
        ∇J(...)の引数がθでないのはDだけ → 即答
      </div>
    </section>
  );
}

// --- セクション3: Pathological Curvature ---

const PC_ANALYSIS_ROWS = [
  {
    label: 'A',
    text: 'SGDでは谷の壁に沿って振動が起き、収束が遅くなる',
    correct: true,
    reason: '正しい。PCの典型的な症状',
  },
  {
    label: 'B',
    text: 'SGDは局所最小値に陥りやすい問題である',
    correct: false,
    reason: '不適切。PCは振動の問題であり局所最小値とは無関係',
  },
  {
    label: 'C',
    text: 'Momentumは慣性により振動を抑制し、収束を加速する',
    correct: true,
    reason: '正しい。Momentumの主要な利点',
  },
  {
    label: 'D',
    text: '損失関数の等高線が細長い楕円状になる現象',
    correct: true,
    reason: '正しい。PCの定義そのもの',
  },
];

function PathologicalCurvatureSection() {
  const sgdPath = generateSgdPath(15);
  const momentumPath = generateMomentumPath(15, 0.9);

  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">3. Pathological Curvature</h3>

      {/* SVG軌跡図 */}
      <div className="flex justify-center">
        <svg viewBox="0 0 260 120" className="w-full max-w-md" role="img">
          <title>SGD vs Momentum 軌跡比較</title>
          {/* 等高線（細長い楕円谷） */}
          <ellipse
            cx="130"
            cy="60"
            rx="120"
            ry="50"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />
          <ellipse
            cx="130"
            cy="60"
            rx="90"
            ry="35"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />
          <ellipse
            cx="130"
            cy="60"
            rx="55"
            ry="18"
            fill="none"
            stroke={OPTIMIZER_COLORS.contour}
            strokeWidth="0.8"
          />

          {/* SGD軌跡（赤: 振動） */}
          <polyline
            points={toPolylinePoints(
              sgdPath.map((p) => ({ x: p.x, y: 60 + p.y * 0.8 })),
            )}
            fill="none"
            stroke={OPTIMIZER_COLORS.sgd}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Momentum軌跡（青: 減衰） */}
          <polyline
            points={toPolylinePoints(
              momentumPath.map((p) => ({ x: p.x, y: 60 + p.y * 0.8 })),
            )}
            fill="none"
            stroke={OPTIMIZER_COLORS.momentum}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* 凡例 */}
          <line
            x1="15"
            y1="10"
            x2="30"
            y2="10"
            stroke={OPTIMIZER_COLORS.sgd}
            strokeWidth="2"
          />
          <text x="33" y="14" fontSize="9" fill={OPTIMIZER_COLORS.sgd}>
            SGD（振動）
          </text>
          <line
            x1="15"
            y1="22"
            x2="30"
            y2="22"
            stroke={OPTIMIZER_COLORS.momentum}
            strokeWidth="2"
          />
          <text x="33" y="26" fontSize="9" fill={OPTIMIZER_COLORS.momentum}>
            Momentum（減衰）
          </text>
        </svg>
      </div>

      {/* 選択肢分析テーブル */}
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                選択肢
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                判定
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                理由
              </th>
            </tr>
          </thead>
          <tbody>
            {PC_ANALYSIS_ROWS.map((row) => (
              <tr
                key={row.label}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  !row.correct ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-xs font-bold">
                  {row.label}
                </td>
                <td className="px-2 py-1.5 text-xs font-semibold">
                  {row.correct ? (
                    <span className="text-green-600 dark:text-green-400">
                      正しい
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      不適切
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 判別のコツ */}
      <div className="p-2.5 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200">
        「振動→収束遅延」と「局所最小値に陥る」は全く別の現象。Bだけ概念を混同
      </div>
    </section>
  );
}

// --- セクション4: 3手法まとめ比較表 ---

const SUMMARY_ROWS = [
  {
    aspect: '更新式',
    sgd: 'θ − η∇J',
    momentum: 'v=γv+η∇J; θ−v',
    nag: 'v=γv+η∇J(θ−γv); θ−v',
  },
  {
    aspect: '利点',
    sgd: 'シンプル',
    momentum: '振動抑制・加速',
    nag: '先読みで過剰更新抑制',
  },
  {
    aspect: '弱点',
    sgd: 'PCに弱い',
    momentum: '先読みなし',
    nag: '計算コスト微増',
  },
];

function SummarySection() {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-bold">4. 3手法まとめ比較</h3>

      <div className="overflow-x-auto">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-600">
              <th className="px-2 py-1 text-left text-xs text-gray-500" />
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                SGD
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                Momentum
              </th>
              <th className="px-2 py-1 text-left text-xs text-gray-500">
                NAG
              </th>
            </tr>
          </thead>
          <tbody>
            {SUMMARY_ROWS.map((row) => (
              <tr
                key={row.aspect}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {row.aspect}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.sgd}</td>
                <td className="px-2 py-1.5 font-mono text-xs">
                  {row.momentum}
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{row.nag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- 親コンポーネント ---

/** Optimizer（Momentum / NAG / Pathological Curvature）のビジュアル解説 */
export function OptimizerExplanation() {
  return (
    <div className="space-y-8">
      <MomentumUpdateSection />
      <NagLookaheadSection />
      <PathologicalCurvatureSection />
      <SummarySection />

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <details>
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            4択問題で確認する
          </summary>
          <div className="mt-3">
            <ExamQ8Optimizer />
          </div>
        </details>
      </div>
    </div>
  );
}
