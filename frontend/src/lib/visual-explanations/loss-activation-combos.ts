export interface TaskCombo {
  id: string;
  taskName: string;
  example: string;
  outputShape: string;
  activation: string;
  loss: string;
  latexActivation: string;
  latexLoss: string;
  keyPoint: string;
}

export interface OrdinalThreshold {
  label: string;
  description: string;
  thresholdValue: number;
}

/** 4種類の分類タスクと活性化関数・損失関数の正しい組み合わせ */
export function getTaskCombos(): TaskCombo[] {
  return [
    {
      id: 'binary',
      taskName: '2値分類',
      example: 'スパム判定（スパム / 非スパム）',
      outputShape: '1ユニット',
      activation: 'シグモイド',
      loss: 'バイナリクロスエントロピー',
      latexActivation: '\\sigma(z) = \\frac{1}{1+e^{-z}}',
      latexLoss: '-[y\\log p + (1-y)\\log(1-p)]',
      keyPoint: '出力は1つの確率値（0〜1）',
    },
    {
      id: 'multiclass',
      taskName: '多クラス分類',
      example: '手書き数字認識（0〜9の10クラス）',
      outputShape: 'Kユニット（クラス数）',
      activation: 'ソフトマックス',
      loss: 'クロスエントロピー（カテゴリカル）',
      latexActivation: '\\text{softmax}(z_k) = \\frac{e^{z_k}}{\\sum_j e^{z_j}}',
      latexLoss: '-\\sum_{k} y_k \\log p_k',
      keyPoint: '出力の合計が1（排他的）',
    },
    {
      id: 'multilabel',
      taskName: 'マルチラベル分類',
      example: '映画ジャンル（アクション＆コメディ）',
      outputShape: 'Kユニット（ラベル数）',
      activation: 'シグモイド（各出力に独立）',
      loss: 'バイナリクロスエントロピー（各出力に独立）',
      latexActivation: '\\sigma(z_k) = \\frac{1}{1+e^{-z_k}}',
      latexLoss: '-\\sum_{k}[y_k\\log p_k + (1-y_k)\\log(1-p_k)]',
      keyPoint: '各ラベルが独立した2値判定',
    },
    {
      id: 'ordinal',
      taskName: '順序回帰',
      example: 'レビュー評価（★1〜★5）',
      outputShape: 'K-1ユニット（閾値数）',
      activation: 'シグモイド（各閾値に独立）',
      loss: 'バイナリクロスエントロピー（各閾値に独立）',
      latexActivation: '\\sigma(z_k) = P(y \\geq k+1)',
      latexLoss: '-\\sum_{k}[t_k\\log p_k + (1-t_k)\\log(1-p_k)]',
      keyPoint: '各閾値が独立した「○以上か？」の2値判定',
    },
  ];
}

/** 順序回帰の閾値データを生成（numClasses: クラス数、閾値はK-1個） */
export function getOrdinalThresholds(numClasses: number): OrdinalThreshold[] {
  const thresholds: OrdinalThreshold[] = [];
  for (let k = 2; k <= numClasses; k++) {
    thresholds.push({
      label: `≥ ${k}`,
      description: `${k}以上か？`,
      thresholdValue: k,
    });
  }
  return thresholds;
}
