import { describe, it, expect } from 'vitest';
import {
  getConfusionMatrixSummary,
  getMatrixCells,
  getMetricFormulas,
} from '@/lib/visual-explanations/confusion-matrix';
import type {
  MatrixCell,
  MetricFormula,
} from '@/lib/visual-explanations/confusion-matrix';

describe('getConfusionMatrixSummary', () => {
  it('非空の文字列を返す', () => {
    const summary = getConfusionMatrixSummary();
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe('string');
  });
});

describe('getMatrixCells', () => {
  it('headers に row と col を含む', () => {
    const { headers } = getMatrixCells();
    expect(headers.row).toHaveLength(2);
    expect(headers.col).toHaveLength(2);
  });

  it('cells が 2x2 の配列を返す', () => {
    const { cells } = getMatrixCells();
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveLength(2);
    expect(cells[1]).toHaveLength(2);
  });

  it('TP が [0][0] に位置する', () => {
    const { cells } = getMatrixCells();
    expect(cells[0][0].id).toBe('tp');
    expect(cells[0][0].abbreviation).toBe('TP');
  });

  it('FN が [0][1] に位置する', () => {
    const { cells } = getMatrixCells();
    expect(cells[0][1].id).toBe('fn');
    expect(cells[0][1].abbreviation).toBe('FN');
  });

  it('FP が [1][0] に位置する', () => {
    const { cells } = getMatrixCells();
    expect(cells[1][0].id).toBe('fp');
    expect(cells[1][0].abbreviation).toBe('FP');
  });

  it('TN が [1][1] に位置する', () => {
    const { cells } = getMatrixCells();
    expect(cells[1][1].id).toBe('tn');
    expect(cells[1][1].abbreviation).toBe('TN');
  });

  it('各セルに必要なプロパティがある', () => {
    const { cells } = getMatrixCells();
    cells.flat().forEach((cell: MatrixCell) => {
      expect(cell.id).toBeTruthy();
      expect(cell.label).toBeTruthy();
      expect(cell.abbreviation).toBeTruthy();
      expect(cell.description).toBeTruthy();
      expect(cell.colorClass).toBeTruthy();
    });
  });
});

describe('getMetricFormulas', () => {
  it('4件の指標を返す', () => {
    const formulas = getMetricFormulas();
    expect(formulas).toHaveLength(4);
  });

  it('各指標に name, enName, formula, cells プロパティがある', () => {
    const formulas = getMetricFormulas();
    formulas.forEach((f: MetricFormula) => {
      expect(f.name).toBeTruthy();
      expect(f.enName).toBeTruthy();
      expect(f.formula).toBeTruthy();
      expect(f.cells.length).toBeGreaterThan(0);
    });
  });

  it('正解率・適合率・再現率・F1スコアを含む', () => {
    const formulas = getMetricFormulas();
    const names = formulas.map((f: MetricFormula) => f.name);
    expect(names).toContain('正解率');
    expect(names).toContain('適合率');
    expect(names).toContain('再現率');
    expect(names).toContain('F1スコア');
  });

  it('Accuracy, Precision, Recall, F1 Score の英語名を含む', () => {
    const formulas = getMetricFormulas();
    const enNames = formulas.map((f: MetricFormula) => f.enName);
    expect(enNames).toContain('Accuracy');
    expect(enNames).toContain('Precision');
    expect(enNames).toContain('Recall');
    expect(enNames).toContain('F1 Score');
  });
});
