import { describe, it, expect } from 'vitest';
import {
  getTaskCombos,
  getOrdinalThresholds,
  type TaskCombo,
} from '@/lib/visual-explanations/loss-activation-combos';

describe('getTaskCombos', () => {
  it('4種類のタスクの組み合わせを返す', () => {
    const combos = getTaskCombos();
    expect(combos).toHaveLength(4);
  });

  it('各タスクに必要なフィールドが含まれる', () => {
    const combos = getTaskCombos();
    for (const c of combos) {
      expect(c.id).toBeTruthy();
      expect(c.taskName).toBeTruthy();
      expect(c.example).toBeTruthy();
      expect(c.outputShape).toBeTruthy();
      expect(c.activation).toBeTruthy();
      expect(c.loss).toBeTruthy();
      expect(c.keyPoint).toBeTruthy();
    }
  });

  it('IDの順序は binary, multiclass, multilabel, ordinal', () => {
    const ids = getTaskCombos().map((c) => c.id);
    expect(ids).toEqual(['binary', 'multiclass', 'multilabel', 'ordinal']);
  });

  it('2値分類はシグモイド + バイナリクロスエントロピー', () => {
    const binary = getTaskCombos().find((c) => c.id === 'binary');
    expect(binary?.activation).toContain('シグモイド');
    expect(binary?.loss).toContain('バイナリクロスエントロピー');
  });

  it('多クラス分類はソフトマックス + クロスエントロピー', () => {
    const mc = getTaskCombos().find((c) => c.id === 'multiclass');
    expect(mc?.activation).toContain('ソフトマックス');
    expect(mc?.loss).toContain('クロスエントロピー');
    // 「バイナリ」は含まない
    expect(mc?.loss).not.toContain('バイナリ');
  });

  it('マルチラベル分類はシグモイド + バイナリクロスエントロピー', () => {
    const ml = getTaskCombos().find((c) => c.id === 'multilabel');
    expect(ml?.activation).toContain('シグモイド');
    expect(ml?.loss).toContain('バイナリクロスエントロピー');
  });

  it('順序回帰はシグモイド + バイナリクロスエントロピー', () => {
    const ord = getTaskCombos().find((c) => c.id === 'ordinal');
    expect(ord?.activation).toContain('シグモイド');
    expect(ord?.loss).toContain('バイナリクロスエントロピー');
  });

  it('各タスクにlatex数式が設定されている', () => {
    const combos = getTaskCombos();
    for (const c of combos) {
      expect(c.latexActivation).toBeTruthy();
      expect(c.latexLoss).toBeTruthy();
    }
  });
});

describe('getOrdinalThresholds', () => {
  it('5クラスの場合4つの閾値を返す', () => {
    const thresholds = getOrdinalThresholds(5);
    expect(thresholds).toHaveLength(4);
  });

  it('3クラスの場合2つの閾値を返す', () => {
    const thresholds = getOrdinalThresholds(3);
    expect(thresholds).toHaveLength(2);
  });

  it('各閾値にlabel, description, thresholdValueが含まれる', () => {
    const thresholds = getOrdinalThresholds(5);
    for (const t of thresholds) {
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.thresholdValue).toBeGreaterThanOrEqual(2);
    }
  });

  it('閾値は昇順に並んでいる', () => {
    const thresholds = getOrdinalThresholds(5);
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i].thresholdValue).toBeGreaterThan(
        thresholds[i - 1].thresholdValue,
      );
    }
  });
});
