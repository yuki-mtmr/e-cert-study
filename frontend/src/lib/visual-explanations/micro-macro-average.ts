/** 3×3 混同行列 (行=実際, 列=予測) */
export type ConfusionMatrix3x3 = number[][];

export interface ClassMetrics {
  className: string;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface AverageResult {
  precision: number;
  recall: number;
  f1: number;
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  icon: string;
  correctAnswer: 'macro' | 'micro' | 'either';
  explanation: string;
}

const CLASS_NAMES = ['犬', '猫', '鳥'];

/**
 * 3×3混同行列から各クラスの TP/FP/FN/Precision/Recall/F1 を導出
 */
export function deriveClassMetrics(matrix: ConfusionMatrix3x3): ClassMetrics[] {
  const n = matrix.length;
  return Array.from({ length: n }, (_, classIdx) => {
    // TP: 対角要素
    const tp = matrix[classIdx][classIdx];

    // FP: そのクラスの列の合計 - TP（他クラスがこのクラスと予測された数）
    let fp = 0;
    for (let row = 0; row < n; row++) {
      if (row !== classIdx) fp += matrix[row][classIdx];
    }

    // FN: そのクラスの行の合計 - TP（このクラスが他クラスと予測された数）
    let fn = 0;
    for (let col = 0; col < n; col++) {
      if (col !== classIdx) fn += matrix[classIdx][col];
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      className: CLASS_NAMES[classIdx],
      tp,
      fp,
      fn,
      precision,
      recall,
      f1,
    };
  });
}

/**
 * マクロ平均: 各クラスの指標を単純平均
 */
export function computeMacroAverage(metrics: ClassMetrics[]): AverageResult {
  const n = metrics.length;
  const precision = metrics.reduce((s, m) => s + m.precision, 0) / n;
  const recall = metrics.reduce((s, m) => s + m.recall, 0) / n;
  const f1 = metrics.reduce((s, m) => s + m.f1, 0) / n;
  return { precision, recall, f1 };
}

/**
 * マイクロ平均: 全クラスの TP/FP/FN を合算してから計算
 */
export function computeMicroAverage(metrics: ClassMetrics[]): AverageResult {
  const totalTp = metrics.reduce((s, m) => s + m.tp, 0);
  const totalFp = metrics.reduce((s, m) => s + m.fp, 0);
  const totalFn = metrics.reduce((s, m) => s + m.fn, 0);

  const precision = totalTp + totalFp > 0 ? totalTp / (totalTp + totalFp) : 0;
  const recall = totalTp + totalFn > 0 ? totalTp / (totalTp + totalFn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

/** デフォルトの3×3混同行列（不均衡データ: 犬=多数派、猫/鳥=少数派） */
export function getDefaultMatrix(): ConfusionMatrix3x3 {
  return [
    [80, 5, 5],   // 犬: 多数派（90件）高性能
    [15, 20, 10],  // 猫: 少数派（45件）低性能
    [10, 5, 15],   // 鳥: 少数派（30件）低性能
  ];
}

/** マイクロ/マクロ平均に関する5問クイズ */
export function getQuizQuestions(): QuizQuestion[] {
  return [
    {
      id: 'q1',
      scenario: 'クラスの不均衡が激しく、少数クラスの性能も重視したい場合',
      icon: '⚖️',
      correctAnswer: 'macro',
      explanation:
        'マクロ平均は各クラスを等しく扱うため、少数クラスの性能が大きく影響します。',
    },
    {
      id: 'q2',
      scenario: '全サンプル中の正解率（全体のTP合計）を知りたい場合',
      icon: '📊',
      correctAnswer: 'micro',
      explanation:
        'マイクロ平均はサンプル数に基づく合算なので、全体の正解率に近い値になります。',
    },
    {
      id: 'q3',
      scenario: 'すべてのクラスが同じサンプル数を持つ均衡データの場合',
      icon: '🟰',
      correctAnswer: 'either',
      explanation:
        '均衡データではマクロ平均とマイクロ平均がほぼ一致するため、どちらでも同じです。',
    },
    {
      id: 'q4',
      scenario: 'スパムフィルタ（スパム/非スパム）で、99%が非スパムのデータ',
      icon: '📧',
      correctAnswer: 'macro',
      explanation:
        'マイクロ平均は多数派クラスに引きずられ、スパム検出の性能が見えにくくなります。',
    },
    {
      id: 'q5',
      scenario: '検索エンジンで全ユーザーの平均的な検索品質を測りたい場合',
      icon: '🔍',
      correctAnswer: 'micro',
      explanation:
        '全クエリを合算するマイクロ平均が、全体の検索品質をよく反映します。',
    },
  ];
}
