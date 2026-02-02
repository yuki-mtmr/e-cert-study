'use client';

import { useState, useRef, useEffect } from 'react';
import type { CategoryTree } from '@/types';
import styles from './CategorySelector.module.css';

// 単一選択モード用のprops
interface SingleSelectProps {
  categories: CategoryTree[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  loading?: boolean;
  multiSelect?: false;
}

// 複数選択モード用のprops
interface MultiSelectProps {
  categories: CategoryTree[];
  selectedCategoryIds: string[];
  onSelectMultiple: (categoryIds: string[]) => void;
  loading?: boolean;
  multiSelect: true;
}

type CategorySelectorProps = SingleSelectProps | MultiSelectProps;

/**
 * カテゴリ選択コンポーネント
 * 階層構造のカテゴリをドロップダウンで表示
 *
 * multiSelect=trueの場合は複数選択（チェックボックス）モード
 */
export function CategorySelector(props: CategorySelectorProps) {
  const { categories, loading = false } = props;
  const multiSelect = 'multiSelect' in props && props.multiSelect === true;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // カテゴリをフラットなリストに変換（階層情報付き）
  const flattenCategories = (
    cats: CategoryTree[],
    depth: number = 0
  ): Array<{ category: CategoryTree; depth: number }> => {
    const result: Array<{ category: CategoryTree; depth: number }> = [];
    for (const cat of cats) {
      result.push({ category: cat, depth });
      if (cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenCategories(categories);

  // 選択中のカテゴリ名を取得（単一選択モード）
  const getSelectedName = (): string => {
    if (multiSelect) {
      const selectedIds = (props as MultiSelectProps).selectedCategoryIds;
      if (selectedIds.length === 0) {
        return '全カテゴリ';
      }
      return `${selectedIds.length}個選択中`;
    }

    const selectedCategoryId = (props as SingleSelectProps).selectedCategoryId;
    if (selectedCategoryId === null) {
      return '全カテゴリ';
    }
    const found = flatCategories.find(
      (item) => item.category.id === selectedCategoryId
    );
    return found?.category.name || '全カテゴリ';
  };

  // 単一選択ハンドラー
  const handleSingleSelect = (categoryId: string | null) => {
    if (!multiSelect) {
      (props as SingleSelectProps).onSelect(categoryId);
      setIsOpen(false);
    }
  };

  // 複数選択ハンドラー
  const handleMultiSelect = (categoryId: string, checked: boolean) => {
    if (multiSelect) {
      const currentIds = (props as MultiSelectProps).selectedCategoryIds;
      let newIds: string[];
      if (checked) {
        newIds = [...currentIds, categoryId];
      } else {
        newIds = currentIds.filter((id) => id !== categoryId);
      }
      (props as MultiSelectProps).onSelectMultiple(newIds);
    }
  };

  // チェック状態を取得
  const isChecked = (categoryId: string): boolean => {
    if (multiSelect) {
      return (props as MultiSelectProps).selectedCategoryIds.includes(categoryId);
    }
    return false;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getSelectedName()}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul role="listbox" className={styles.dropdown}>
          {/* 全カテゴリオプション（単一選択モードのみ） */}
          {!multiSelect && (
            <li
              role="option"
              aria-selected={(props as SingleSelectProps).selectedCategoryId === null}
              className={`${styles.option} ${
                (props as SingleSelectProps).selectedCategoryId === null ? styles.selected : ''
              }`}
              onClick={() => handleSingleSelect(null)}
            >
              全カテゴリ
            </li>
          )}

          {flatCategories.map(({ category, depth }) => (
            <li
              key={category.id}
              role={multiSelect ? undefined : 'option'}
              aria-selected={
                multiSelect
                  ? undefined
                  : (props as SingleSelectProps).selectedCategoryId === category.id
              }
              data-child={depth > 0 ? 'true' : undefined}
              className={`${styles.option} ${
                !multiSelect && (props as SingleSelectProps).selectedCategoryId === category.id
                  ? styles.selected
                  : ''
              } ${depth > 0 ? styles.child : styles.parent}`}
              style={{ paddingLeft: `${12 + depth * 20}px` }}
              onClick={multiSelect ? undefined : () => handleSingleSelect(category.id)}
            >
              {multiSelect ? (
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    role="checkbox"
                    checked={isChecked(category.id)}
                    onChange={(e) => handleMultiSelect(category.id, e.target.checked)}
                    className={styles.customCheckbox}
                  />
                  {depth > 0 && <span className={styles.indent}>└ </span>}
                  {category.name}
                </label>
              ) : (
                <>
                  {depth > 0 && <span className={styles.indent}>└ </span>}
                  {category.name}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
