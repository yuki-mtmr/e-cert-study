import { describe, it, expect } from 'vitest';
import { examQ5Data } from '@/lib/visual-explanations/exam-q5-activation-backward';

describe('examQ5Data', () => {
  it('idが "exam-q5-activation-backward" である', () => {
    expect(examQ5Data.id).toBe('exam-q5-activation-backward');
  });

  it('タイトルに "大問5" と "活性化関数" を含む', () => {
    expect(examQ5Data.title).toContain('大問5');
    expect(examQ5Data.title).toContain('活性化関数');
  });

  it('3つの小問がある', () => {
    expect(examQ5Data.subQuestions).toHaveLength(3);
  });

  it('classCodeにSigmoid, ReLU, Tanhクラスが含まれる', () => {
    expect(examQ5Data.classCode).toContain('Sigmoid');
    expect(examQ5Data.classCode).toContain('Relu');
    expect(examQ5Data.classCode).toContain('Tanh');
  });

  it('小問1(あ): Sigmoid backward, 正解が C', () => {
    const sq = examQ5Data.subQuestions[0];
    expect(sq.blankLabel).toBe('あ');
    expect(sq.correctLabel).toBe('C');
  });

  it('小問2(い): ReLU backward mask値, 正解が B', () => {
    const sq = examQ5Data.subQuestions[1];
    expect(sq.blankLabel).toBe('い');
    expect(sq.correctLabel).toBe('B');
  });

  it('小問3(う): Tanh backward, 正解が D', () => {
    const sq = examQ5Data.subQuestions[2];
    expect(sq.blankLabel).toBe('う');
    expect(sq.correctLabel).toBe('D');
  });

  it('各小問に4つの選択肢がある', () => {
    examQ5Data.subQuestions.forEach((sq) => {
      expect(sq.choices).toHaveLength(4);
      expect(sq.choices.map((c) => c.label)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  it('各小問に解説がある', () => {
    examQ5Data.subQuestions.forEach((sq) => {
      expect(sq.explanation.length).toBeGreaterThan(0);
    });
  });
});
