import { CELL_COLORS } from '@/lib/visual-explanations/confusion-matrix';
import type {
  VisualFraction as VisualFractionType,
  FractionTerm,
} from '@/lib/visual-explanations/confusion-matrix';

interface VisualFractionProps {
  fraction: VisualFractionType;
}

/** 分数の各項をレンダリング */
function renderTerms(terms: FractionTerm[]) {
  return terms.map((term, i) => (
    <span key={`${term.cellId}-${i}`} className="inline-flex items-center">
      {i > 0 && <span className="mx-1 text-gray-500">+</span>}
      <span className={`font-bold ${CELL_COLORS[term.cellId]}`}>
        {term.coefficient ? `${term.coefficient}` : ''}
        {term.label}
      </span>
    </span>
  ));
}

/** CSS分数レンダラ（分子/線/分母） */
export function VisualFraction({ fraction }: VisualFractionProps) {
  return (
    <div className="inline-flex flex-col items-center">
      <div data-testid="fraction-numerator" className="flex items-center justify-center px-1">
        {renderTerms(fraction.numerator)}
      </div>
      <div
        data-testid="fraction-line"
        className="w-full border-t-2 border-gray-400 dark:border-gray-500 my-0.5"
      />
      <div data-testid="fraction-denominator" className="flex items-center justify-center px-1">
        {renderTerms(fraction.denominator)}
      </div>
    </div>
  );
}
