/**
 * カテゴリ選択コンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategorySelector } from '../CategorySelector';
import type { CategoryTree } from '@/types';

const mockCategoryTree: CategoryTree[] = [
  {
    id: 'math',
    name: '応用数学',
    parentId: null,
    children: [
      {
        id: 'linear',
        name: '線形代数',
        parentId: 'math',
        children: [],
      },
      {
        id: 'prob',
        name: '確率・統計',
        parentId: 'math',
        children: [],
      },
    ],
  },
  {
    id: 'ml',
    name: '機械学習',
    parentId: null,
    children: [
      {
        id: 'supervised',
        name: '教師あり学習',
        parentId: 'ml',
        children: [],
      },
    ],
  },
];

describe('CategorySelector', () => {
  it('カテゴリツリーを表示する', () => {
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId={null}
        onSelect={vi.fn()}
      />
    );

    // 「全カテゴリ」オプションが表示される
    expect(screen.getByText('全カテゴリ')).toBeInTheDocument();
  });

  it('ドロップダウンをクリックするとカテゴリ一覧が表示される', async () => {
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId={null}
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('応用数学')).toBeInTheDocument();
      expect(screen.getByText('機械学習')).toBeInTheDocument();
    });
  });

  it('子カテゴリはインデントされて表示される', async () => {
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId={null}
        onSelect={vi.fn()}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const linearOption = screen.getByText('線形代数');
      // 子カテゴリはインデントマーカーを持つ
      expect(linearOption.closest('[data-child="true"]')).toBeTruthy();
    });
  });

  it('カテゴリを選択するとonSelectが呼ばれる', async () => {
    const onSelect = vi.fn();
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId={null}
        onSelect={onSelect}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const mathOption = screen.getByText('応用数学');
      fireEvent.click(mathOption);
    });

    expect(onSelect).toHaveBeenCalledWith('math');
  });

  it('「全カテゴリ」を選択するとnullが渡される', async () => {
    const onSelect = vi.fn();
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId="math"
        onSelect={onSelect}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);

    await waitFor(() => {
      const allOption = screen.getByText('全カテゴリ');
      fireEvent.click(allOption);
    });

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('選択中のカテゴリが表示される', () => {
    render(
      <CategorySelector
        categories={mockCategoryTree}
        selectedCategoryId="linear"
        onSelect={vi.fn()}
      />
    );

    // 選択されたカテゴリ名が表示される
    expect(screen.getByText('線形代数')).toBeInTheDocument();
  });

  it('空のカテゴリリストでも動作する', () => {
    render(
      <CategorySelector
        categories={[]}
        selectedCategoryId={null}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('全カテゴリ')).toBeInTheDocument();
  });

  it('ローディング中は表示される', () => {
    render(
      <CategorySelector
        categories={[]}
        selectedCategoryId={null}
        onSelect={vi.fn()}
        loading={true}
      />
    );

    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });

  // 複数選択モードのテスト
  describe('複数選択モード', () => {
    it('multiSelectがtrueの時はチェックボックスが表示される', async () => {
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={[]}
          onSelectMultiple={vi.fn()}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        // チェックボックスがあることを確認
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('複数のカテゴリを選択できる', async () => {
      const onSelectMultiple = vi.fn();
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={[]}
          onSelectMultiple={onSelectMultiple}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const mathCheckbox = screen.getByLabelText('応用数学');
        fireEvent.click(mathCheckbox);
      });

      // 1回目の選択で['math']が返る
      expect(onSelectMultiple).toHaveBeenCalledWith(['math']);
    });

    it('既存の選択に追加できる', async () => {
      const onSelectMultiple = vi.fn();
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={['math']}
          onSelectMultiple={onSelectMultiple}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const mlCheckbox = screen.getByLabelText('機械学習');
        fireEvent.click(mlCheckbox);
      });

      // 既存の'math'に'ml'が追加される
      expect(onSelectMultiple).toHaveBeenCalledWith(['math', 'ml']);
    });

    it('選択済みのカテゴリのチェックを外せる', async () => {
      const onSelectMultiple = vi.fn();
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={['math', 'ml']}
          onSelectMultiple={onSelectMultiple}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const mathCheckbox = screen.getByLabelText('応用数学');
        fireEvent.click(mathCheckbox);
      });

      // mathが外れてmlだけになる
      expect(onSelectMultiple).toHaveBeenCalledWith(['ml']);
    });

    it('選択中のカテゴリ数が表示される', () => {
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={['math', 'ml']}
          onSelectMultiple={vi.fn()}
          multiSelect={true}
        />
      );

      expect(screen.getByText(/2個選択中/)).toBeInTheDocument();
    });

    it('何も選択していない時は「全カテゴリ」と表示される', () => {
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={[]}
          onSelectMultiple={vi.fn()}
          multiSelect={true}
        />
      );

      expect(screen.getByText('全カテゴリ')).toBeInTheDocument();
    });

    it('チェックボックスにカスタムスタイルが適用されている', async () => {
      render(
        <CategorySelector
          categories={mockCategoryTree}
          selectedCategoryIds={[]}
          onSelectMultiple={vi.fn()}
          multiSelect={true}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // チェックボックスにcustomCheckboxクラスが適用されていることを確認
        checkboxes.forEach((checkbox) => {
          expect(checkbox.className).toContain('customCheckbox');
        });
      });
    });
  });
});
