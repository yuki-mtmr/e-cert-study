'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

/**
 * 画像表示コンポーネント（拡大対応）
 *
 * クリックでモーダル表示して拡大可能
 */
export function ImageViewer({ src, alt, caption, className }: ImageViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Escapeキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // モーダル表示中はスクロールを無効化
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, closeModal]);

  return (
    <div className={className}>
      {/* サムネイル */}
      <figure className="my-4">
        <img
          src={src}
          alt={alt}
          onClick={openModal}
          className="max-w-full h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity mx-auto"
        />
        {caption && (
          <figcaption className="text-center text-sm text-gray-600 mt-2">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* モーダル */}
      {isModalOpen && (
        <div
          data-testid="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={closeModal}
        >
          {/* 閉じるボタン */}
          <button
            onClick={closeModal}
            aria-label="close"
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-10"
          >
            &times;
          </button>

          {/* 拡大画像 */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
