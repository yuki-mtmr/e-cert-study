import { describe, it, expect } from 'vitest';
import {
  sigmoid,
  sigmoidDerivative,
  tanhActivation,
  tanhDerivative,
  relu,
  reluDerivative,
  getActivationInfos,
} from '@/lib/visual-explanations/activation-functions';
import type { ActivationId } from '@/lib/visual-explanations/activation-functions';

describe('activation-functions', () => {
  describe('sigmoid', () => {
    it('sigmoid(0) = 0.5', () => {
      expect(sigmoid(0)).toBeCloseTo(0.5);
    });

    it('大きな正の値で1に近づく', () => {
      expect(sigmoid(10)).toBeCloseTo(1, 4);
    });

    it('大きな負の値で0に近づく', () => {
      expect(sigmoid(-10)).toBeCloseTo(0, 4);
    });

    it('負の入力でも正の出力を返す（値域0〜1）', () => {
      expect(sigmoid(-3)).toBeGreaterThan(0);
      expect(sigmoid(-3)).toBeLessThan(1);
    });
  });

  describe('sigmoidDerivative', () => {
    it('z=0で最大値0.25を取る', () => {
      expect(sigmoidDerivative(0)).toBeCloseTo(0.25);
    });

    it('|z|が大きいと0に近づく（勾配消失）', () => {
      expect(sigmoidDerivative(6)).toBeLessThan(0.01);
      expect(sigmoidDerivative(-6)).toBeLessThan(0.01);
    });
  });

  describe('tanhActivation', () => {
    it('tanh(0) = 0', () => {
      expect(tanhActivation(0)).toBeCloseTo(0);
    });

    it('値域は-1〜1', () => {
      expect(tanhActivation(10)).toBeCloseTo(1, 4);
      expect(tanhActivation(-10)).toBeCloseTo(-1, 4);
    });
  });

  describe('tanhDerivative', () => {
    it('z=0で最大値1を取る', () => {
      expect(tanhDerivative(0)).toBeCloseTo(1);
    });

    it('|z|が大きいと0に近づく', () => {
      expect(tanhDerivative(6)).toBeLessThan(0.01);
    });
  });

  describe('relu', () => {
    it('正の入力はそのまま返す', () => {
      expect(relu(3)).toBe(3);
    });

    it('負の入力は0を返す', () => {
      expect(relu(-3)).toBe(0);
    });

    it('0は0を返す', () => {
      expect(relu(0)).toBe(0);
    });
  });

  describe('reluDerivative', () => {
    it('正の入力で1を返す', () => {
      expect(reluDerivative(3)).toBe(1);
    });

    it('負の入力で0を返す', () => {
      expect(reluDerivative(-3)).toBe(0);
    });
  });

  describe('getActivationInfos', () => {
    it('3つの活性化関数情報を返す', () => {
      const infos = getActivationInfos();
      expect(infos).toHaveLength(3);
    });

    it('各情報に必要なフィールドが含まれる', () => {
      const infos = getActivationInfos();
      for (const info of infos) {
        expect(info.id).toBeTruthy();
        expect(info.name).toBeTruthy();
        expect(info.formula).toBeTruthy();
        expect(info.derivativeFormula).toBeTruthy();
        expect(info.range).toBeTruthy();
        expect(info.keyPoint).toBeTruthy();
        expect(typeof info.fn).toBe('function');
        expect(typeof info.derivative).toBe('function');
      }
    });

    it('IDがsigmoid, tanh, reluの順', () => {
      const infos = getActivationInfos();
      const ids = infos.map((i) => i.id);
      expect(ids).toEqual(['sigmoid', 'tanh', 'relu']);
    });

    it('fn/derivativeが対応する関数と一致する', () => {
      const infos = getActivationInfos();
      const sigmoidInfo = infos.find((i) => i.id === 'sigmoid')!;
      expect(sigmoidInfo.fn(0)).toBeCloseTo(0.5);
      expect(sigmoidInfo.derivative(0)).toBeCloseTo(0.25);
    });
  });

  describe('ActivationId 型', () => {
    it('有効な型として使える', () => {
      const id: ActivationId = 'sigmoid';
      expect(['sigmoid', 'tanh', 'relu']).toContain(id);
    });
  });
});
