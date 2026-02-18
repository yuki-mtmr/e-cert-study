import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivationCurveChart } from '../visual-explanations/exam-hints/ActivationCurveChart';

const identity = (x: number) => x;
const constant = (_x: number) => 1;

describe('ActivationCurveChart', () => {
  it('SVG要素を描画する', () => {
    const { container } = render(
      <ActivationCurveChart fn={identity} derivative={constant} label="test" />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('aria-labelにラベルを含む', () => {
    render(
      <ActivationCurveChart fn={identity} derivative={constant} label="Sigmoid" />,
    );
    expect(screen.getByLabelText('Sigmoid の関数と導関数グラフ')).toBeInTheDocument();
  });

  it('関数曲線と導関数曲線の2本のpathを描画する', () => {
    const { container } = render(
      <ActivationCurveChart fn={identity} derivative={constant} label="test" />,
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('凡例テキストを表示する', () => {
    render(
      <ActivationCurveChart fn={identity} derivative={constant} label="σ(x)" />,
    );
    expect(screen.getByText('f(x)')).toBeInTheDocument();
    expect(screen.getByText("f'(x)")).toBeInTheDocument();
  });

  it('注釈テキストを表示できる', () => {
    render(
      <ActivationCurveChart
        fn={identity}
        derivative={constant}
        label="test"
        annotation="最大値0.25"
      />,
    );
    expect(screen.getByText('最大値0.25')).toBeInTheDocument();
  });
});
