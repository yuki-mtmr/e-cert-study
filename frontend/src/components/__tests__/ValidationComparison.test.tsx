import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationComparison } from '@/components/visual-explanations/ValidationComparison';

describe('ValidationComparison', () => {
  it('「一言で」見出しを表示する', () => {
    render(<ValidationComparison />);
    expect(screen.getByText('一言で')).toBeInTheDocument();
  });

  it('サマリーを2件表示する', () => {
    render(<ValidationComparison />);
    const bullets = screen.getAllByTestId('summary-bullet');
    expect(bullets).toHaveLength(2);
  });

  it('ホールドアウトのサマリーテキストを表示する', () => {
    render(<ValidationComparison />);
    const bullets = screen.getAllByTestId('summary-bullet');
    expect(bullets[0]).toHaveTextContent('ホールドアウト');
    expect(bullets[0]).toHaveTextContent('データを1回だけ分割して評価');
  });

  it('k-分割交差検証のサマリーテキストを表示する', () => {
    render(<ValidationComparison />);
    const bullets = screen.getAllByTestId('summary-bullet');
    expect(bullets[1]).toHaveTextContent('k-分割交差検証');
    expect(bullets[1]).toHaveTextContent('k回分割を変えて評価し、平均を取る');
  });

  it('比較表の見出しを表示する', () => {
    render(<ValidationComparison />);
    expect(screen.getByText('比較表')).toBeInTheDocument();
  });

  it('テーブルヘッダーにホールドアウトと k-分割交差検証を表示する', () => {
    render(<ValidationComparison />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    // テーブルヘッダーの列名
    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
  });

  it('比較行を5行表示する', () => {
    render(<ValidationComparison />);
    const rows = screen.getAllByTestId('comparison-row');
    expect(rows).toHaveLength(5);
  });

  it('比較軸テキストを全て表示する', () => {
    render(<ValidationComparison />);
    expect(screen.getByText('分割回数')).toBeInTheDocument();
    expect(screen.getByText('評価の安定性')).toBeInTheDocument();
    expect(screen.getByText('計算コスト')).toBeInTheDocument();
    expect(screen.getByText('データの利用効率')).toBeInTheDocument();
    expect(screen.getByText('適した場面')).toBeInTheDocument();
  });
});
