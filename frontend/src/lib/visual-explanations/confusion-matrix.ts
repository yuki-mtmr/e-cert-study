export type CellId = 'tp' | 'fp' | 'fn' | 'tn';

export interface MatrixCell {
  id: CellId;
  label: string;
  abbreviation: string;
  description: string;
  colorClass: string;
}

export interface MatrixHeader {
  row: string[];
  col: string[];
}

export interface FractionTerm {
  cellId: CellId;
  coefficient?: number;
  label: string;
}

export interface VisualFraction {
  numerator: FractionTerm[];
  denominator: FractionTerm[];
}

export interface HighlightGroup {
  numeratorCells: CellId[];
  denominatorOnlyCells: CellId[];
}

export interface MetricFormulaV2 {
  id: string;
  name: string;
  enName: string;
  fraction: VisualFraction;
  tip: string;
  highlight: HighlightGroup;
  cells: CellId[];
}

/** セルIDごとのテキスト色クラス（分数表示用） */
export const CELL_COLORS: Record<CellId, string> = {
  tp: 'text-green-600 dark:text-green-400',
  fp: 'text-orange-600 dark:text-orange-400',
  fn: 'text-red-600 dark:text-red-400',
  tn: 'text-blue-600 dark:text-blue-400',
};

/** 混同行列の一言サマリー */
export function getConfusionMatrixSummary(): string {
  return '予測結果と実際のラベルの組み合わせを2x2の表にまとめたもの。TP/FP/FN/TNの4分類で分類性能を把握できる。';
}

/** 混同行列の2x2マトリクスデータ */
export function getMatrixCells(): { headers: MatrixHeader; cells: MatrixCell[][] } {
  const headers: MatrixHeader = {
    row: ['実際: 陽性', '実際: 陰性'],
    col: ['予測: 陽性', '予測: 陰性'],
  };

  const cells: MatrixCell[][] = [
    [
      {
        id: 'tp',
        label: '真陽性',
        abbreviation: 'TP',
        description: '陽性を正しく陽性と予測',
        colorClass: 'bg-green-100 dark:bg-green-900/30',
      },
      {
        id: 'fn',
        label: '偽陰性',
        abbreviation: 'FN',
        description: '陽性を誤って陰性と予測',
        colorClass: 'bg-red-100 dark:bg-red-900/30',
      },
    ],
    [
      {
        id: 'fp',
        label: '偽陽性',
        abbreviation: 'FP',
        description: '陰性を誤って陽性と予測',
        colorClass: 'bg-orange-100 dark:bg-orange-900/30',
      },
      {
        id: 'tn',
        label: '真陰性',
        abbreviation: 'TN',
        description: '陰性を正しく陰性と予測',
        colorClass: 'bg-blue-100 dark:bg-blue-900/30',
      },
    ],
  ];

  return { headers, cells };
}

/** 混同行列から導出される6指標（ビジュアル分数形式） */
export function getMetricFormulasV2(): MetricFormulaV2[] {
  return [
    {
      id: 'accuracy',
      name: '正解率',
      enName: 'Accuracy',
      fraction: {
        numerator: [
          { cellId: 'tp', label: 'TP' },
          { cellId: 'tn', label: 'TN' },
        ],
        denominator: [
          { cellId: 'tp', label: 'TP' },
          { cellId: 'fp', label: 'FP' },
          { cellId: 'fn', label: 'FN' },
          { cellId: 'tn', label: 'TN' },
        ],
      },
      tip: '全部の中から正解したやつの比率',
      highlight: {
        numeratorCells: ['tp', 'tn'],
        denominatorOnlyCells: ['fp', 'fn'],
      },
      cells: ['tp', 'tn', 'fp', 'fn'],
    },
    {
      id: 'precision',
      name: '適合率',
      enName: 'Precision',
      fraction: {
        numerator: [{ cellId: 'tp', label: 'TP' }],
        denominator: [
          { cellId: 'tp', label: 'TP' },
          { cellId: 'fp', label: 'FP' },
        ],
      },
      tip: '予測で陽性と言った中で本当に陽性（予測陽性の列）',
      highlight: {
        numeratorCells: ['tp'],
        denominatorOnlyCells: ['fp'],
      },
      cells: ['tp', 'fp'],
    },
    {
      id: 'recall',
      name: '再現率',
      enName: 'Recall',
      fraction: {
        numerator: [{ cellId: 'tp', label: 'TP' }],
        denominator: [
          { cellId: 'tp', label: 'TP' },
          { cellId: 'fn', label: 'FN' },
        ],
      },
      tip: '実際の陽性をどれだけ見つけた（実際陽性の行）',
      highlight: {
        numeratorCells: ['tp'],
        denominatorOnlyCells: ['fn'],
      },
      cells: ['tp', 'fn'],
    },
    {
      id: 'f1',
      name: 'F1スコア',
      enName: 'F1 Score',
      fraction: {
        numerator: [{ cellId: 'tp', label: 'TP', coefficient: 2 }],
        denominator: [
          { cellId: 'tp', label: 'TP', coefficient: 2 },
          { cellId: 'fp', label: 'FP' },
          { cellId: 'fn', label: 'FN' },
        ],
      },
      tip: '上下にTPが来て、下はフォルス系に1/2かける',
      highlight: {
        numeratorCells: ['tp'],
        denominatorOnlyCells: ['fp', 'fn'],
      },
      cells: ['tp', 'fp', 'fn'],
    },
    {
      id: 'fpr',
      name: '偽陽性率',
      enName: 'FPR',
      fraction: {
        numerator: [{ cellId: 'fp', label: 'FP' }],
        denominator: [
          { cellId: 'fp', label: 'FP' },
          { cellId: 'tn', label: 'TN' },
        ],
      },
      tip: '実際陰性なのに陽性と誤判定（実際陰性の行）',
      highlight: {
        numeratorCells: ['fp'],
        denominatorOnlyCells: ['tn'],
      },
      cells: ['fp', 'tn'],
    },
    {
      id: 'fnr',
      name: '偽陰性率',
      enName: 'FNR',
      fraction: {
        numerator: [{ cellId: 'fn', label: 'FN' }],
        denominator: [
          { cellId: 'fn', label: 'FN' },
          { cellId: 'tp', label: 'TP' },
        ],
      },
      tip: '実際陽性なのに見逃した（実際陽性の行）',
      highlight: {
        numeratorCells: ['fn'],
        denominatorOnlyCells: ['tp'],
      },
      cells: ['fn', 'tp'],
    },
  ];
}
