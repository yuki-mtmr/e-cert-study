'use client';

import { useState } from 'react';

interface QuizSetupProps {
  categories: readonly string[];
  onStart: (options: { categories: string[]; shuffle: boolean }) => void;
}

export function QuizSetup({ categories, onStart }: QuizSetupProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(categories));
  const [shuffle, setShuffle] = useState(true);

  function toggleCategory(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        カテゴリ選択
      </h2>

      {/* 全選択/全解除ボタン */}
      <div className="flex gap-2 mb-3">
        <button
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => setSelected(new Set(categories))}
        >
          全選択
        </button>
        <button
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => setSelected(new Set())}
        >
          全解除
        </button>
      </div>

      {/* カテゴリチェックボックス */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
        {categories.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(cat)}
              onChange={() => toggleCategory(cat)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            {cat}
          </label>
        ))}
      </div>

      {/* シャッフルトグル */}
      <label className="flex items-center gap-2 mb-6 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={shuffle}
          onChange={(e) => setShuffle(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        シャッフル
      </label>

      {/* 開始ボタン */}
      <button
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        disabled={selected.size === 0}
        onClick={() => onStart({ categories: [...selected], shuffle })}
      >
        クイズ開始
      </button>
    </div>
  );
}
