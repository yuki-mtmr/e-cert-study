import { describe, it, expect } from 'vitest';
import {
  shuffleQuestions,
  filterByCategories,
  filterByIds,
  calculateCategoryStats,
  getIncorrectQuestions,
  calculateAccuracy,
  getChoiceClassName,
  getAccuracyLevel,
  ACCURACY_THRESHOLDS,
} from '../memorization-quiz';
import type { MemorizationQuestion, UserAnswer } from '@/types/memorization';
import { QUIZ_ANSWER_LABELS } from '@/types/memorization';

/** テスト用の問題データ */
const SAMPLE_QUESTIONS: MemorizationQuestion[] = [
  { id: 1, category: '最適化', question: 'Q1', choices: ['A', 'B', 'C', 'D'], answer: 'A', hint: 'H1' },
  { id: 2, category: '最適化', question: 'Q2', choices: ['A', 'B', 'C', 'D'], answer: 'B', hint: 'H2' },
  { id: 3, category: 'CNN', question: 'Q3', choices: ['A', 'B', 'C', 'D'], answer: 'C', hint: 'H3' },
  { id: 4, category: 'CNN', question: 'Q4', choices: ['A', 'B', 'C', 'D'], answer: 'D', hint: 'H4' },
  { id: 5, category: 'Transformer', question: 'Q5', choices: ['A', 'B', 'C', 'D'], answer: 'A', hint: 'H5' },
];

describe('shuffleQuestions', () => {
  it('返却配列の長さが元と同じ', () => {
    const result = shuffleQuestions(SAMPLE_QUESTIONS);
    expect(result).toHaveLength(SAMPLE_QUESTIONS.length);
  });

  it('元の配列を変更しない（イミュータブル）', () => {
    const original = [...SAMPLE_QUESTIONS];
    shuffleQuestions(SAMPLE_QUESTIONS);
    expect(SAMPLE_QUESTIONS).toEqual(original);
  });

  it('全要素が含まれる', () => {
    const result = shuffleQuestions(SAMPLE_QUESTIONS);
    const ids = result.map((q) => q.id).sort();
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  it('空配列に対して空配列を返す', () => {
    expect(shuffleQuestions([])).toEqual([]);
  });
});

describe('filterByCategories', () => {
  it('指定カテゴリの問題だけ返す', () => {
    const result = filterByCategories(SAMPLE_QUESTIONS, ['CNN']);
    expect(result).toHaveLength(2);
    expect(result.every((q) => q.category === 'CNN')).toBe(true);
  });

  it('複数カテゴリでフィルタ', () => {
    const result = filterByCategories(SAMPLE_QUESTIONS, ['最適化', 'Transformer']);
    expect(result).toHaveLength(3);
  });

  it('空カテゴリで空配列を返す', () => {
    const result = filterByCategories(SAMPLE_QUESTIONS, []);
    expect(result).toEqual([]);
  });

  it('存在しないカテゴリで空配列を返す', () => {
    const result = filterByCategories(SAMPLE_QUESTIONS, ['存在しない']);
    expect(result).toEqual([]);
  });
});

describe('filterByIds', () => {
  it('指定IDの問題だけ返す', () => {
    const result = filterByIds(SAMPLE_QUESTIONS, [1, 3, 5]);
    expect(result).toHaveLength(3);
    expect(result.map((q) => q.id)).toEqual([1, 3, 5]);
  });

  it('存在しないIDは無視', () => {
    const result = filterByIds(SAMPLE_QUESTIONS, [1, 99]);
    expect(result).toHaveLength(1);
  });

  it('空IDで空配列を返す', () => {
    expect(filterByIds(SAMPLE_QUESTIONS, [])).toEqual([]);
  });
});

describe('calculateCategoryStats', () => {
  const answers: UserAnswer[] = [
    { questionId: 1, selected: 'A', isCorrect: true },
    { questionId: 2, selected: 'A', isCorrect: false },
    { questionId: 3, selected: 'C', isCorrect: true },
    { questionId: 4, selected: 'A', isCorrect: false },
    { questionId: 5, selected: 'A', isCorrect: true },
  ];

  it('カテゴリ別の統計を正しく計算', () => {
    const stats = calculateCategoryStats(SAMPLE_QUESTIONS, answers);
    expect(stats).toHaveLength(3);

    const opt = stats.find((s) => s.category === '最適化');
    expect(opt).toEqual({ category: '最適化', total: 2, correct: 1, accuracy: 50 });

    const cnn = stats.find((s) => s.category === 'CNN');
    expect(cnn).toEqual({ category: 'CNN', total: 2, correct: 1, accuracy: 50 });

    const tf = stats.find((s) => s.category === 'Transformer');
    expect(tf).toEqual({ category: 'Transformer', total: 1, correct: 1, accuracy: 100 });
  });

  it('回答がない場合は空配列を返す', () => {
    expect(calculateCategoryStats(SAMPLE_QUESTIONS, [])).toEqual([]);
  });
});

describe('getIncorrectQuestions', () => {
  const answers: UserAnswer[] = [
    { questionId: 1, selected: 'A', isCorrect: true },
    { questionId: 2, selected: 'A', isCorrect: false },
    { questionId: 3, selected: 'A', isCorrect: false },
  ];

  it('不正解の問題を返す', () => {
    const result = getIncorrectQuestions(SAMPLE_QUESTIONS, answers);
    expect(result).toHaveLength(2);
    expect(result.map((q) => q.id)).toEqual([2, 3]);
  });

  it('全問正解なら空配列', () => {
    const allCorrect: UserAnswer[] = [
      { questionId: 1, selected: 'A', isCorrect: true },
    ];
    expect(getIncorrectQuestions(SAMPLE_QUESTIONS, allCorrect)).toEqual([]);
  });
});

describe('calculateAccuracy', () => {
  it('正答率を正しく計算する', () => {
    expect(calculateAccuracy(3, 5)).toBe(60);
  });

  it('全問正解で100を返す', () => {
    expect(calculateAccuracy(10, 10)).toBe(100);
  });

  it('全問不正解で0を返す', () => {
    expect(calculateAccuracy(0, 5)).toBe(0);
  });

  it('0除算ガード: total=0で0を返す', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it('端数を四捨五入する', () => {
    // 1/3 = 33.333... → 33
    expect(calculateAccuracy(1, 3)).toBe(33);
    // 2/3 = 66.666... → 67
    expect(calculateAccuracy(2, 3)).toBe(67);
  });
});

describe('QUIZ_ANSWER_LABELS', () => {
  it('4要素の配列', () => {
    expect(QUIZ_ANSWER_LABELS).toHaveLength(4);
  });

  it('A, B, C, Dを含む', () => {
    expect(QUIZ_ANSWER_LABELS).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('getChoiceClassName', () => {
  it('未回答時: hover付きスタイルを返す', () => {
    const cls = getChoiceClassName('A', false, 'A', null);
    expect(cls).toContain('hover:bg-blue-50');
    expect(cls).toContain('cursor-pointer');
  });

  it('回答済み・正解の選択肢: 緑色スタイル', () => {
    const cls = getChoiceClassName('B', true, 'B', 'B');
    expect(cls).toContain('border-green-500');
    expect(cls).toContain('bg-green-50');
  });

  it('回答済み・ユーザーが選んだ不正解の選択肢: 赤色スタイル', () => {
    const cls = getChoiceClassName('A', true, 'B', 'A');
    expect(cls).toContain('border-red-500');
    expect(cls).toContain('bg-red-50');
  });

  it('回答済み・その他の選択肢: 薄いスタイル', () => {
    const cls = getChoiceClassName('C', true, 'B', 'A');
    expect(cls).toContain('opacity-50');
  });
});

describe('getAccuracyLevel', () => {
  it('80%以上はgood', () => {
    expect(getAccuracyLevel(80)).toBe('good');
    expect(getAccuracyLevel(100)).toBe('good');
  });

  it('50%以上80%未満はfair', () => {
    expect(getAccuracyLevel(50)).toBe('fair');
    expect(getAccuracyLevel(79)).toBe('fair');
  });

  it('50%未満はpoor', () => {
    expect(getAccuracyLevel(49)).toBe('poor');
    expect(getAccuracyLevel(0)).toBe('poor');
  });
});

describe('ACCURACY_THRESHOLDS', () => {
  it('GOODが80、FAIRが50', () => {
    expect(ACCURACY_THRESHOLDS.GOOD).toBe(80);
    expect(ACCURACY_THRESHOLDS.FAIR).toBe(50);
  });
});
