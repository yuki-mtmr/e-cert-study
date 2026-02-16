'use client';

import { useState, useEffect } from 'react';
import type { GroupedTerms } from '@/types/glossary';
import { GlossaryTermCard } from './GlossaryTermCard';

interface GlossarySectionProps {
  group: GroupedTerms;
  defaultOpen: boolean;
}

export function GlossarySection({ group, defaultOpen }: GlossarySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {group.section.emoji} {group.section.name}
        </span>
        <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{group.termCount}用語</span>
          <span className="text-lg">{isOpen ? '▼' : '▶'}</span>
        </span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-6">
          {group.subsections.map(({ subsection, terms }) => (
            <div key={subsection.id}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                {subsection.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {terms.map((term) => (
                  <GlossaryTermCard key={term.id} term={term} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
