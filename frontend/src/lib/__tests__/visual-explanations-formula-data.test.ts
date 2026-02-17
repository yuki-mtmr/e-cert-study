import { describe, it, expect } from 'vitest';
import {
  FORMULA_COLORS,
  getFormulaTabs,
} from '@/lib/visual-explanations/formula-data';
import type {
  FormulaTabData,
  FormulaPart,
} from '@/lib/visual-explanations/formula-data';

describe('FORMULA_COLORS', () => {
  it('必要な色キーが定義されている', () => {
    expect(FORMULA_COLORS).toHaveProperty('modelMean');
    expect(FORMULA_COLORS).toHaveProperty('prediction');
    expect(FORMULA_COLORS).toHaveProperty('trueFunction');
    expect(FORMULA_COLORS).toHaveProperty('observation');
    expect(FORMULA_COLORS).toHaveProperty('bias');
  });

  it('値がCSS色文字列', () => {
    Object.values(FORMULA_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('getFormulaTabs', () => {
  it('3つのタブを返す', () => {
    const tabs = getFormulaTabs();
    expect(tabs).toHaveLength(3);
  });

  it('タブIDが bias, variance, noise', () => {
    const tabs = getFormulaTabs();
    const ids = tabs.map((t) => t.id);
    expect(ids).toContain('bias');
    expect(ids).toContain('variance');
    expect(ids).toContain('noise');
  });

  it('各タブに必要なプロパティがある', () => {
    const tabs = getFormulaTabs();
    tabs.forEach((tab) => {
      expect(tab).toHaveProperty('id');
      expect(tab).toHaveProperty('title');
      expect(tab).toHaveProperty('fullFormula');
      expect(tab).toHaveProperty('parts');
      expect(tab).toHaveProperty('summary');
      expect(tab).toHaveProperty('analogyText');
      expect(tab.fullFormula.length).toBeGreaterThan(0);
      expect(tab.summary.length).toBeGreaterThan(0);
      expect(tab.analogyText.length).toBeGreaterThan(0);
    });
  });

  it('各タブのpartsに1つ以上のパーツがある', () => {
    const tabs = getFormulaTabs();
    tabs.forEach((tab) => {
      expect(tab.parts.length).toBeGreaterThan(0);
    });
  });

  it('各パーツにid, latex, color, label, tooltipがある', () => {
    const tabs = getFormulaTabs();
    tabs.forEach((tab) => {
      tab.parts.forEach((part) => {
        expect(part).toHaveProperty('id');
        expect(part).toHaveProperty('latex');
        expect(part).toHaveProperty('color');
        expect(part).toHaveProperty('label');
        expect(part).toHaveProperty('tooltip');
        expect(part.latex.length).toBeGreaterThan(0);
        expect(part.label.length).toBeGreaterThan(0);
      });
    });
  });

  it('biasタブのタイトルにBias²が含まれる', () => {
    const tabs = getFormulaTabs();
    const biasTab = tabs.find((t) => t.id === 'bias')!;
    expect(biasTab.title).toContain('Bias');
  });

  it('varianceタブのタイトルにVarianceが含まれる', () => {
    const tabs = getFormulaTabs();
    const varTab = tabs.find((t) => t.id === 'variance')!;
    expect(varTab.title).toContain('Variance');
  });

  it('noiseタブのタイトルにNoiseが含まれる', () => {
    const tabs = getFormulaTabs();
    const noiseTab = tabs.find((t) => t.id === 'noise')!;
    expect(noiseTab.title).toContain('Noise');
  });
});
