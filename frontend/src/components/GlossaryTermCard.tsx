import type { GlossaryTerm } from '@/types/glossary';

interface GlossaryTermCardProps {
  term: GlossaryTerm;
}

export function GlossaryTermCard({ term }: GlossaryTermCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
        {term.jaName}
      </h4>
      <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
        {term.enName}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {term.description}
      </p>
    </div>
  );
}
