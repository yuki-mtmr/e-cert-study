/** バイアス-バリアンス-ノイズ分解の数式データ定義 */

export interface FormulaPart {
  id: string;
  latex: string;
  color: string;
  label: string;
  tooltip: string;
}

export interface FormulaTabData {
  id: 'bias' | 'variance' | 'noise';
  title: string;
  fullFormula: string;
  parts: FormulaPart[];
  summary: string;
  analogyText: string;
}

/** セクション共通の色定義 */
export const FORMULA_COLORS: Record<string, string> = {
  modelMean: '#3B82F6',
  prediction: '#EF4444',
  trueFunction: '#10B981',
  observation: '#F59E0B',
  bias: '#8B5CF6',
} as const;

/** 3タブ（Bias² / Variance / Noise）のデータ定義 */
export function getFormulaTabs(): FormulaTabData[] {
  return [
    {
      id: 'bias',
      title: 'Bias²（バイアスの二乗）',
      fullFormula:
        '\\int \\{E_D[y(\\mathbf{x};D)] - h(\\mathbf{x})\\}^2 d\\mathbf{x}',
      parts: [
        {
          id: 'model-mean',
          latex: 'E_D[y(\\mathbf{x};D)]',
          color: FORMULA_COLORS.modelMean,
          label: 'モデル平均',
          tooltip:
            '異なる訓練データで学習したモデルの予測を平均したもの',
        },
        {
          id: 'true-fn',
          latex: 'h(\\mathbf{x})',
          color: FORMULA_COLORS.trueFunction,
          label: '真の関数',
          tooltip: 'データを生成した真の関数（ノイズなし）',
        },
        {
          id: 'squared',
          latex: '\\{\\cdots\\}^2',
          color: '#6B7280',
          label: '二乗',
          tooltip: 'ズレの大きさを二乗して常に正にする',
        },
        {
          id: 'integral',
          latex: '\\int d\\mathbf{x}',
          color: '#9CA3AF',
          label: '積分',
          tooltip: '全ての入力xにわたって合計する',
        },
      ],
      summary:
        'モデルの平均的な予測が、真の答えからどれだけズレているか',
      analogyText: '狙いの中心が的の中心からどれだけ外れているか',
    },
    {
      id: 'variance',
      title: 'Variance（バリアンス）',
      fullFormula:
        '\\int E_D[\\{y(\\mathbf{x};D) - E_D[y(\\mathbf{x};D)]\\}^2] d\\mathbf{x}',
      parts: [
        {
          id: 'prediction',
          latex: 'y(\\mathbf{x};D)',
          color: FORMULA_COLORS.prediction,
          label: '個別予測',
          tooltip:
            '特定の訓練データDで学習したモデルの予測値',
        },
        {
          id: 'model-mean',
          latex: 'E_D[y(\\mathbf{x};D)]',
          color: FORMULA_COLORS.modelMean,
          label: 'モデル平均',
          tooltip:
            '異なる訓練データで学習したモデルの予測を平均したもの',
        },
        {
          id: 'squared',
          latex: '\\{\\cdots\\}^2',
          color: '#6B7280',
          label: '二乗',
          tooltip: 'バラつきの大きさを二乗して常に正にする',
        },
        {
          id: 'expectation',
          latex: 'E_D[\\cdots]',
          color: FORMULA_COLORS.bias,
          label: '期待値',
          tooltip: '異なる訓練データにわたる平均',
        },
      ],
      summary:
        '訓練データが変わるたびに、予測がどれだけバラつくか',
      analogyText: '弾がどれだけ散らばるか',
    },
    {
      id: 'noise',
      title: 'Noise（ノイズ）',
      fullFormula:
        '\\iint \\{h(\\mathbf{x}) - t\\}^2 p(\\mathbf{x},t) d\\mathbf{x}dt',
      parts: [
        {
          id: 'true-fn',
          latex: 'h(\\mathbf{x})',
          color: FORMULA_COLORS.trueFunction,
          label: '真の関数',
          tooltip: 'データを生成した真の関数（ノイズなし）',
        },
        {
          id: 'observation',
          latex: 't',
          color: FORMULA_COLORS.observation,
          label: '観測値',
          tooltip: '実際に観測されたデータの値（ノイズ込み）',
        },
        {
          id: 'squared',
          latex: '\\{\\cdots\\}^2',
          color: '#6B7280',
          label: '二乗',
          tooltip: 'ノイズの大きさを二乗して常に正にする',
        },
        {
          id: 'joint-dist',
          latex: 'p(\\mathbf{x},t)',
          color: '#9CA3AF',
          label: '同時分布',
          tooltip: '入力xと観測値tの同時確率分布',
        },
        {
          id: 'double-integral',
          latex: '\\iint d\\mathbf{x}dt',
          color: '#9CA3AF',
          label: '二重積分',
          tooltip: '全てのxとtにわたって合計する',
        },
      ],
      summary: 'データ自体が持つ、どうしようもないバラつき',
      analogyText: '的自体がどれだけ揺れているか',
    },
  ];
}
