'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getConceptMap } from '@/data/glossary/concept-maps';
import { SUBSECTIONS } from '@/data/glossary/sections';
import { MATH_TERMS } from '@/data/glossary/terms-math';
import { ML_TERMS } from '@/data/glossary/terms-ml';
import { DL_BASIC_TERMS } from '@/data/glossary/terms-dl-basic';
import { DL_APP_TERMS } from '@/data/glossary/terms-dl-app';
import { DEVOPS_TERMS } from '@/data/glossary/terms-devops';
import { SubsectionNav } from './concept-map/SubsectionNav';
import { SubsectionMapView } from './concept-map/SubsectionMapView';

const ALL_TERMS = [
  ...MATH_TERMS,
  ...ML_TERMS,
  ...DL_BASIC_TERMS,
  ...DL_APP_TERMS,
  ...DEVOPS_TERMS,
];

interface ConceptMapViewProps {
  selectedSectionId?: string;
}

/**
 * コンセプトマップ表示コンポーネント
 *
 * セクション選択に応じたSVGマップを表示し、クリックで拡大モーダルを開く
 * サブセクション選択で用語関係マップにドリルダウン
 */
export function ConceptMapView({ selectedSectionId }: ConceptMapViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  const map = getConceptMap(selectedSectionId);

  // セクション変更時にサブセクション選択をリセット
  useEffect(() => {
    setSelectedSubsectionId(null);
  }, [selectedSectionId]);

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

  // セクション別サブセクション一覧
  const sectionSubsections = useMemo(
    () => selectedSectionId
      ? SUBSECTIONS.filter((ss) => ss.sectionId === selectedSectionId)
      : [],
    [selectedSectionId],
  );

  // サブセクション別用語数
  const termCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ss of sectionSubsections) {
      counts[ss.id] = ALL_TERMS.filter((t) => t.subsectionId === ss.id).length;
    }
    return counts;
  }, [sectionSubsections]);

  // ドリルダウン先のサブセクション情報
  const selectedSubsection = useMemo(
    () => selectedSubsectionId
      ? SUBSECTIONS.find((ss) => ss.id === selectedSubsectionId)
      : null,
    [selectedSubsectionId],
  );

  const subsectionTerms = useMemo(
    () => selectedSubsectionId
      ? ALL_TERMS.filter((t) => t.subsectionId === selectedSubsectionId)
      : [],
    [selectedSubsectionId],
  );

  // サブセクション選択中はドリルダウンビュー
  if (selectedSubsectionId && selectedSubsection) {
    return (
      <SubsectionMapView
        subsectionId={selectedSubsectionId}
        subsectionName={selectedSubsection.name}
        terms={subsectionTerms}
        onBack={() => setSelectedSubsectionId(null)}
      />
    );
  }

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

      {/* サブセクションカード一覧（セクション選択時のみ） */}
      {selectedSectionId && sectionSubsections.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            サブセクション用語関係マップ
          </h3>
          <SubsectionNav
            subsections={sectionSubsections}
            termCounts={termCounts}
            onSelect={setSelectedSubsectionId}
          />
        </div>
      )}

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
