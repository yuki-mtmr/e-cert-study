import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShootingTargetSection } from '../visual-explanations/ShootingTargetSection';

describe('ShootingTargetSection', () => {
  it('セクション見出しを表示する', () => {
    render(<ShootingTargetSection />);
    expect(screen.getByText(/射撃アナロジー/)).toBeInTheDocument();
  });

  it('静的ターゲットを4つ描画する', () => {
    const { container } = render(<ShootingTargetSection />);
    const staticTargets = container.querySelectorAll('[data-testid="static-target"]');
    expect(staticTargets).toHaveLength(4);
  });

  it('インタラクティブターゲットを1つ描画する', () => {
    const { container } = render(<ShootingTargetSection />);
    const interactive = container.querySelector('[data-testid="interactive-target"]');
    expect(interactive).toBeInTheDocument();
  });

  it('4つのシナリオラベルを全て表示する', () => {
    render(<ShootingTargetSection />);
    expect(screen.getByText('低Bias・低Variance')).toBeInTheDocument();
    expect(screen.getByText('高Bias・低Variance')).toBeInTheDocument();
    expect(screen.getByText('低Bias・高Variance')).toBeInTheDocument();
    expect(screen.getByText('高Bias・高Variance')).toBeInTheDocument();
  });
});
