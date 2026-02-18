import { describe, it, expect } from 'vitest';
import { MEMORIZATION_QUESTIONS, QUIZ_META } from '../memorization-quiz';
import type { MemorizationQuestion, QuizAnswerLabel } from '@/types/memorization';

const VALID_ANSWERS: QuizAnswerLabel[] = ['A', 'B', 'C', 'D'];

describe('memorization-quiz データ整合性', () => {
  it('42問のデータが存在する', () => {
    expect(MEMORIZATION_QUESTIONS).toHaveLength(42);
  });

  it('各問題のidが1〜42の連番', () => {
    const ids = MEMORIZATION_QUESTIONS.map((q) => q.id);
    for (let i = 1; i <= 42; i++) {
      expect(ids).toContain(i);
    }
  });

  it('各問題が正しい型構造を持つ', () => {
    for (const q of MEMORIZATION_QUESTIONS) {
      expect(typeof q.id).toBe('number');
      expect(typeof q.category).toBe('string');
      expect(q.category.length).toBeGreaterThan(0);
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.choices).toHaveLength(4);
      q.choices.forEach((c) => expect(typeof c).toBe('string'));
      expect(VALID_ANSWERS).toContain(q.answer);
      expect(typeof q.hint).toBe('string');
    }
  });

  it('メタデータが正しい', () => {
    expect(QUIZ_META.title).toBe('E資格過去問クイズ');
    expect(QUIZ_META.categories).toHaveLength(15);
    expect(QUIZ_META.totalQuestions).toBe(42);
  });

  it('全問題のカテゴリがメタデータのカテゴリに含まれる', () => {
    for (const q of MEMORIZATION_QUESTIONS) {
      expect(QUIZ_META.categories).toContain(q.category);
    }
  });

  it('メタデータの全カテゴリに1問以上の問題が存在する', () => {
    for (const cat of QUIZ_META.categories) {
      const count = MEMORIZATION_QUESTIONS.filter((q) => q.category === cat).length;
      expect(count).toBeGreaterThan(0);
    }
  });
});
