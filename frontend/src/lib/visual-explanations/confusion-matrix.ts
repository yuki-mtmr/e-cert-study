export interface MatrixCell {
  id: 'tp' | 'fp' | 'fn' | 'tn';
  label: string;
  abbreviation: string;
  description: string;
  colorClass: string;
}

export interface MatrixHeader {
  row: string[];
  col: string[];
}

export interface MetricFormula {
  name: string;
  enName: string;
  formula: string;
  cells: ('tp' | 'fp' | 'fn' | 'tn')[];
}

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

/** 混同行列から導出される4指標の計算式 */
export function getMetricFormulas(): MetricFormula[] {
  return [
    {
      name: '正解率',
      enName: 'Accuracy',
      formula: '(TP + TN) / (TP + FP + FN + TN)',
      cells: ['tp', 'tn', 'fp', 'fn'],
    },
    {
      name: '適合率',
      enName: 'Precision',
      formula: 'TP / (TP + FP)',
      cells: ['tp', 'fp'],
    },
    {
      name: '再現率',
      enName: 'Recall',
      formula: 'TP / (TP + FN)',
      cells: ['tp', 'fn'],
    },
    {
      name: 'F1スコア',
      enName: 'F1 Score',
      formula: '2 × Precision × Recall / (Precision + Recall)',
      cells: ['tp', 'fp', 'fn'],
    },
  ];
}
