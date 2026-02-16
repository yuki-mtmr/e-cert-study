'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConceptMap } from '@/data/glossary/concept-maps';

interface ConceptMapViewProps {
  selectedSectionId?: string;
}

/**
 * コンセプトマップ表示コンポーネント
 *
 * セクション選択に応じたSVGマップを表示し、クリックで拡大モーダルを開く
 */
export function ConceptMapView({ selectedSectionId }: ConceptMapViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const map = getConceptMap(selectedSectionId);

  const openModal = () => setIsModalOpen(true);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, closeModal]);

  return (
    <div className="space-y-3">
      {/* タイトル・説明 */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {map.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {map.description}
        </p>
      </div>

      {/* SVGマップ */}
      <div className="overflow-x-auto">
        <img
          src={map.svgPath}
          alt={`${map.title}のコンセプトマップ`}
          onClick={openModal}
          className="max-w-full h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity mx-auto dark:invert dark:hue-rotate-180"
        />
      </div>

      {/* 拡大モーダル */}
      {isModalOpen && (
        <div
          data-testid="concept-map-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            aria-label="close"
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10"
          >
            &times;
          </button>
          <img
            src={map.svgPath}
            alt={`${map.title}のコンセプトマップ（拡大）`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain dark:invert dark:hue-rotate-180"
          />
        </div>
      )}
    </div>
  );
}
