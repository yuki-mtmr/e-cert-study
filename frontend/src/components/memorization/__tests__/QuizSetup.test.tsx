import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizSetup } from '../QuizSetup';

const CATEGORIES = ['最適化', 'CNN', 'Transformer'];

describe('QuizSetup', () => {
  it('カテゴリチェックボックスを表示', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    for (const cat of CATEGORIES) {
      expect(screen.getByLabelText(cat)).toBeInTheDocument();
    }
  });

  it('デフォルトで全カテゴリ選択済み', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    for (const cat of CATEGORIES) {
      expect(screen.getByLabelText(cat)).toBeChecked();
    }
  });

  it('全解除ボタンで全チェック外れる', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('全解除'));
    for (const cat of CATEGORIES) {
      expect(screen.getByLabelText(cat)).not.toBeChecked();
    }
  });

  it('全選択ボタンで全チェック入る', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('全解除'));
    fireEvent.click(screen.getByText('全選択'));
    for (const cat of CATEGORIES) {
      expect(screen.getByLabelText(cat)).toBeChecked();
    }
  });

  it('シャッフルトグルが存在する', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    expect(screen.getByLabelText('シャッフル')).toBeInTheDocument();
  });

  it('開始ボタンで選択カテゴリとシャッフル設定を渡す', () => {
    const onStart = vi.fn();
    render(<QuizSetup categories={CATEGORIES} onStart={onStart} />);
    // CNNのチェックを外す
    fireEvent.click(screen.getByLabelText('CNN'));
    fireEvent.click(screen.getByText('クイズ開始'));
    expect(onStart).toHaveBeenCalledWith({
      categories: ['最適化', 'Transformer'],
      shuffle: true,
    });
  });

  it('カテゴリ未選択では開始ボタンが無効', () => {
    render(<QuizSetup categories={CATEGORIES} onStart={vi.fn()} />);
    fireEvent.click(screen.getByText('全解除'));
    expect(screen.getByText('クイズ開始')).toBeDisabled();
  });
});
