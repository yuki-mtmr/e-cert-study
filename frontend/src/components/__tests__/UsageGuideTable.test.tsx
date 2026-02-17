import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageGuideTable } from '../visual-explanations/UsageGuideTable';

describe('UsageGuideTable', () => {
  it('使い分けガイドのテーブルを表示する', () => {
    render(<UsageGuideTable />);
    expect(screen.getByText('何がしたい時はこれ')).toBeInTheDocument();
  });

  it('4つの目的行を表示する', () => {
    render(<UsageGuideTable />);
    expect(screen.getByText('外れ値の影響を抑えたい')).toBeInTheDocument();
    expect(screen.getByText('大きな誤差を重点的に減らしたい')).toBeInTheDocument();
    expect(screen.getByText('元データと同じ単位で誤差を把握したい')).toBeInTheDocument();
  });

  it('特性比較テーブルを表示する', () => {
    render(<UsageGuideTable />);
    expect(screen.getByText('特性比較')).toBeInTheDocument();
  });

  it('指標名を表示する', () => {
    render(<UsageGuideTable />);
    // テーブル内の指標名
    const maeElements = screen.getAllByText('MAE');
    expect(maeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('範囲・単位・外れ値感度のヘッダーがある', () => {
    render(<UsageGuideTable />);
    expect(screen.getByText('範囲')).toBeInTheDocument();
    expect(screen.getByText('単位')).toBeInTheDocument();
    expect(screen.getByText('外れ値感度')).toBeInTheDocument();
  });

  it('特性データの値を表示する', () => {
    render(<UsageGuideTable />);
    // 0〜∞はMAE,MSE,RMSEの3つで使われる
    const rangeElements = screen.getAllByText('0〜∞');
    expect(rangeElements.length).toBe(3);
    expect(screen.getByText('無次元')).toBeInTheDocument();
  });
});
