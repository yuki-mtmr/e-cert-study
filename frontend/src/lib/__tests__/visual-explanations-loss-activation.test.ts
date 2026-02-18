import { describe, it, expect } from 'vitest';
import {
  getTaskCombos,
  type TaskCombo,
} from '@/lib/visual-explanations/loss-activation-combos';

describe('getTaskCombos', () => {
  it('3種類のタスクの組み合わせを返す', () => {
    const combos = getTaskCombos();
    expect(combos).toHaveLength(3);
  });

  it('各タスクに必要なフィールドが含まれる', () => {
    const combos = getTaskCombos();
    for (const c of combos) {
      expect(c.id).toBeTruthy();
      expect(c.taskName).toBeTruthy();
      expect(c.example).toBeTruthy();
      expect(c.activation).toBeTruthy();
      expect(c.loss).toBeTruthy();
      expect(c.keyPoint).toBeTruthy();
    }
  });

  it('IDの順序は binary, multiclass, multilabel', () => {
    const ids = getTaskCombos().map((c) => c.id);
    expect(ids).toEqual(['binary', 'multiclass', 'multilabel']);
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
    expect(mc?.loss).not.toContain('バイナリ');
  });

  it('マルチラベル分類はシグモイド + バイナリクロスエントロピー', () => {
    const ml = getTaskCombos().find((c) => c.id === 'multilabel');
    expect(ml?.activation).toContain('シグモイド');
    expect(ml?.loss).toContain('バイナリクロスエントロピー');
  });
});
