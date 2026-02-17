export interface ComparisonRow {
  category: string;
  holdout: string;
  kFold: string;
}

export interface SummaryBullet {
  method: string;
  summary: string;
}

/** ホールドアウトと k-分割交差検証の一言サマリー */
export function getValidationSummary(): SummaryBullet[] {
  return [
    {
      method: 'ホールドアウト',
      summary: 'データを1回だけ分割して評価',
    },
    {
      method: 'k-分割交差検証',
      summary: 'k回分割を変えて評価し、平均を取る',
    },
  ];
}

/** ホールドアウト vs k-分割交差検証の比較表データ */
export function getComparisonRows(): ComparisonRow[] {
  return [
    {
      category: '分割回数',
      holdout: '1回',
      kFold: 'k回',
    },
    {
      category: '評価の安定性',
      holdout: '分割の仕方に依存（ブレやすい）',
      kFold: 'k回の平均なので安定',
    },
    {
      category: '計算コスト',
      holdout: '低い',
      kFold: 'k倍かかる',
    },
    {
      category: 'データの利用効率',
      holdout: '一部が評価専用で無駄',
      kFold: '全データが訓練・評価の両方に使われる',
    },
    {
      category: '適した場面',
      holdout: 'データが大量にあるとき',
      kFold: 'データが限られているとき',
    },
  ];
}
