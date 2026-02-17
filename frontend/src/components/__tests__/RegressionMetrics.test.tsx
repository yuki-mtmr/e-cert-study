import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegressionMetrics } from '../visual-explanations/RegressionMetrics';

describe('RegressionMetrics', () => {
  it('3つのセクションタイトルを表示する', () => {
    render(<RegressionMetrics />);
    expect(screen.getByText('数式クイズ')).toBeInTheDocument();
    expect(screen.getByText('残差ビジュアライゼーション')).toBeInTheDocument();
    expect(screen.getByText('使い分けガイド')).toBeInTheDocument();
  });

  it('4枚のカードを表示する', () => {
    render(<RegressionMetrics />);
    const buttons = screen.getAllByRole('button');
    // 4枚のカード + 「全て表示」「リセット」ボタン = 最低6つ
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('「全て表示」ボタンで全カードを公開する', () => {
    render(<RegressionMetrics />);
    fireEvent.click(screen.getByText('全て表示'));
    // 全指標名が表示される
    expect(screen.getByText('平均絶対誤差')).toBeInTheDocument();
    expect(screen.getByText('平均二乗誤差')).toBeInTheDocument();
    expect(screen.getByText('二乗平均平方根誤差')).toBeInTheDocument();
    expect(screen.getByText('決定係数')).toBeInTheDocument();
  });

  it('「リセット」ボタンで全カードを非公開にする', () => {
    render(<RegressionMetrics />);
    // 全て表示 → リセット
    fireEvent.click(screen.getByText('全て表示'));
    fireEvent.click(screen.getByText('リセット'));
    expect(screen.queryByText('平均絶対誤差')).not.toBeInTheDocument();
  });

  it('散布図セクションを表示する', () => {
    render(<RegressionMetrics />);
    const svg = screen.getByRole('img', { name: '残差ビジュアライゼーション' });
    expect(svg).toBeInTheDocument();
  });

  it('使い分けテーブルを表示する', () => {
    render(<RegressionMetrics />);
    expect(screen.getByText('何がしたい時はこれ')).toBeInTheDocument();
    expect(screen.getByText('特性比較')).toBeInTheDocument();
  });
});
