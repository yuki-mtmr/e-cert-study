import { describe, it, expect } from 'vitest';
import { examQ6Data } from '@/lib/visual-explanations/exam-q6-affine-layer';

describe('examQ6Data', () => {
  it('idが "exam-q6-affine-layer" である', () => {
    expect(examQ6Data.id).toBe('exam-q6-affine-layer');
  });

  it('タイトルに "大問6" と "Affine" を含む', () => {
    expect(examQ6Data.title).toContain('大問6');
    expect(examQ6Data.title).toContain('Affine');
  });

  it('4つの小問がある', () => {
    expect(examQ6Data.subQuestions).toHaveLength(4);
  });

  it('classCodeにAffineクラスが含まれる', () => {
    expect(examQ6Data.classCode).toContain('Affine');
    expect(examQ6Data.classCode).toContain('forward');
    expect(examQ6Data.classCode).toContain('backward');
  });

  it('小問1(あ): forward np.dot引数, 正解が A', () => {
    const sq = examQ6Data.subQuestions[0];
    expect(sq.blankLabel).toBe('あ');
    expect(sq.correctLabel).toBe('A');
  });

  it('小問2(い): backward dx, 正解が D', () => {
    const sq = examQ6Data.subQuestions[1];
    expect(sq.blankLabel).toBe('い');
    expect(sq.correctLabel).toBe('D');
  });

  it('小問3(う): backward dW, 正解が C', () => {
    const sq = examQ6Data.subQuestions[2];
    expect(sq.blankLabel).toBe('う');
    expect(sq.correctLabel).toBe('C');
  });

  it('小問4(え): backward db, 正解が A', () => {
    const sq = examQ6Data.subQuestions[3];
    expect(sq.blankLabel).toBe('え');
    expect(sq.correctLabel).toBe('A');
  });

  it('各小問に4つの選択肢がある', () => {
    examQ6Data.subQuestions.forEach((sq) => {
      expect(sq.choices).toHaveLength(4);
      expect(sq.choices.map((c) => c.label)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  it('各小問に解説がある', () => {
    examQ6Data.subQuestions.forEach((sq) => {
      expect(sq.explanation.length).toBeGreaterThan(0);
    });
  });
});
