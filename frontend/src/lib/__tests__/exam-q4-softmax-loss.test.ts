import { describe, it, expect } from 'vitest';
import { examQ4Data } from '@/lib/visual-explanations/exam-q4-softmax-loss';

describe('examQ4Data', () => {
  it('idが "exam-q4-softmax-loss" である', () => {
    expect(examQ4Data.id).toBe('exam-q4-softmax-loss');
  });

  it('タイトルに "大問4" と "SoftmaxWithLoss" を含む', () => {
    expect(examQ4Data.title).toContain('大問4');
    expect(examQ4Data.title).toContain('SoftmaxWithLoss');
  });

  it('4つの小問がある', () => {
    expect(examQ4Data.subQuestions).toHaveLength(4);
  });

  it('classCodeにSoftmaxWithLossクラスが含まれる', () => {
    expect(examQ4Data.classCode).toContain('SoftmaxWithLoss');
    expect(examQ4Data.classCode).toContain('forward');
    expect(examQ4Data.classCode).toContain('backward');
  });

  it('小問1(あ): 正解が D', () => {
    const sq = examQ4Data.subQuestions[0];
    expect(sq.blankLabel).toBe('あ');
    expect(sq.correctLabel).toBe('D');
  });

  it('小問2(い): 正解が A', () => {
    const sq = examQ4Data.subQuestions[1];
    expect(sq.blankLabel).toBe('い');
    expect(sq.correctLabel).toBe('A');
  });

  it('小問3(う): 正解が C', () => {
    const sq = examQ4Data.subQuestions[2];
    expect(sq.blankLabel).toBe('う');
    expect(sq.correctLabel).toBe('C');
  });

  it('小問4(え): 正解が B', () => {
    const sq = examQ4Data.subQuestions[3];
    expect(sq.blankLabel).toBe('え');
    expect(sq.correctLabel).toBe('B');
  });

  it('各小問に4つの選択肢がある', () => {
    examQ4Data.subQuestions.forEach((sq) => {
      expect(sq.choices).toHaveLength(4);
      expect(sq.choices.map((c) => c.label)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  it('各小問に解説がある', () => {
    examQ4Data.subQuestions.forEach((sq) => {
      expect(sq.explanation.length).toBeGreaterThan(0);
    });
  });
});
