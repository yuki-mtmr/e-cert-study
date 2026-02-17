import { describe, it, expect } from 'vitest';
import {
  getConfusionMatrixSummary,
  getMatrixCells,
  CELL_COLORS,
  getMetricFormulasV2,
} from '@/lib/visual-explanations/confusion-matrix';
import type {
  MatrixCell,
  MetricFormulaV2,
  CellId,
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

describe('CELL_COLORS', () => {
  it('tp, fp, fn, tn の4エントリを持つ', () => {
    const keys = Object.keys(CELL_COLORS);
    expect(keys).toHaveLength(4);
    expect(keys).toContain('tp');
    expect(keys).toContain('fp');
    expect(keys).toContain('fn');
    expect(keys).toContain('tn');
  });

  it('各エントリが text クラス文字列を持つ', () => {
    const cellIds: CellId[] = ['tp', 'fp', 'fn', 'tn'];
    cellIds.forEach((id) => {
      expect(CELL_COLORS[id]).toMatch(/text-/);
    });
  });
});

describe('getMetricFormulasV2', () => {
  it('6件の指標を返す', () => {
    const formulas = getMetricFormulasV2();
    expect(formulas).toHaveLength(6);
  });

  it('各指標に必要なプロパティがある', () => {
    const formulas = getMetricFormulasV2();
    formulas.forEach((f: MetricFormulaV2) => {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.enName).toBeTruthy();
      expect(f.fraction).toBeDefined();
      expect(f.fraction.numerator.length).toBeGreaterThan(0);
      expect(f.fraction.denominator.length).toBeGreaterThan(0);
      expect(f.tip).toBeTruthy();
      expect(f.highlight).toBeDefined();
      expect(f.highlight.numeratorCells.length).toBeGreaterThan(0);
      expect(f.cells.length).toBeGreaterThan(0);
    });
  });

  it('正解率・適合率・再現率・F1スコア・偽陽性率・偽陰性率を含む', () => {
    const formulas = getMetricFormulasV2();
    const names = formulas.map((f) => f.name);
    expect(names).toContain('正解率');
    expect(names).toContain('適合率');
    expect(names).toContain('再現率');
    expect(names).toContain('F1スコア');
    expect(names).toContain('偽陽性率');
    expect(names).toContain('偽陰性率');
  });

  it('英語名を含む', () => {
    const formulas = getMetricFormulasV2();
    const enNames = formulas.map((f) => f.enName);
    expect(enNames).toContain('Accuracy');
    expect(enNames).toContain('Precision');
    expect(enNames).toContain('Recall');
    expect(enNames).toContain('F1 Score');
    expect(enNames).toContain('FPR');
    expect(enNames).toContain('FNR');
  });

  it('F1スコアの分子に coefficient=2 がある', () => {
    const formulas = getMetricFormulasV2();
    const f1 = formulas.find((f) => f.id === 'f1');
    expect(f1).toBeDefined();
    const tpTerm = f1!.fraction.numerator.find((t) => t.cellId === 'tp');
    expect(tpTerm).toBeDefined();
    expect(tpTerm!.coefficient).toBe(2);
  });

  it('F1スコアの分母に coefficient=2 の TP がある', () => {
    const formulas = getMetricFormulasV2();
    const f1 = formulas.find((f) => f.id === 'f1');
    expect(f1).toBeDefined();
    const denomTp = f1!.fraction.denominator.find((t) => t.cellId === 'tp');
    expect(denomTp).toBeDefined();
    expect(denomTp!.coefficient).toBe(2);
  });

  it('適合率の highlight が正しい', () => {
    const formulas = getMetricFormulasV2();
    const precision = formulas.find((f) => f.id === 'precision');
    expect(precision).toBeDefined();
    expect(precision!.highlight.numeratorCells).toEqual(['tp']);
    expect(precision!.highlight.denominatorOnlyCells).toEqual(['fp']);
  });

  it('正解率の highlight が正しい', () => {
    const formulas = getMetricFormulasV2();
    const accuracy = formulas.find((f) => f.id === 'accuracy');
    expect(accuracy).toBeDefined();
    expect(accuracy!.highlight.numeratorCells).toEqual(['tp', 'tn']);
    expect(accuracy!.highlight.denominatorOnlyCells).toEqual(['fp', 'fn']);
  });

  it('偽陽性率の highlight が正しい', () => {
    const formulas = getMetricFormulasV2();
    const fpr = formulas.find((f) => f.id === 'fpr');
    expect(fpr).toBeDefined();
    expect(fpr!.highlight.numeratorCells).toEqual(['fp']);
    expect(fpr!.highlight.denominatorOnlyCells).toEqual(['tn']);
  });
});
