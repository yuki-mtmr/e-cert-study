export interface TaskCombo {
  id: string;
  taskName: string;
  example: string;
  activation: string;
  loss: string;
  keyPoint: string;
}

/** 3種類の分類タスクと活性化関数・損失関数の正しい組み合わせ */
export function getTaskCombos(): TaskCombo[] {
  return [
    {
      id: 'binary',
      taskName: '2値分類',
      example: 'スパム判定（スパム / 非スパム）',
      activation: 'シグモイド',
      loss: 'バイナリクロスエントロピー',
      keyPoint: '出力は1つの確率値（0〜1）',
    },
    {
      id: 'multiclass',
      taskName: '多クラス分類',
      example: '手書き数字認識（0〜9の10クラス）',
      activation: 'ソフトマックス',
      loss: 'クロスエントロピー（カテゴリカル）',
      keyPoint: '出力の合計が1（排他的）',
    },
    {
      id: 'multilabel',
      taskName: 'マルチラベル分類',
      example: '映画ジャンル（アクション＆コメディ）',
      activation: 'シグモイド（各出力に独立）',
      loss: 'バイナリクロスエントロピー（各出力に独立）',
      keyPoint: '各ラベルが独立した2値判定',
    },
  ];
}
