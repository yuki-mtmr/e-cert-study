import type { LayoutResult } from '@/types/concept-map';
import type { GlossaryTerm } from '@/types/glossary';
import { TermNode } from './TermNode';
import { RelationEdge } from './RelationEdge';

interface SubsectionMapProps {
  layout: LayoutResult;
  terms: GlossaryTerm[];
}

const PADDING = 20;

/** サブセクション用語関係マップのSVGコンテナ */
export function SubsectionMap({ layout, terms }: SubsectionMapProps) {
  const termMap = new Map(terms.map((t) => [t.id, t]));

  return (
    <svg
      viewBox={`-${PADDING} -${PADDING} ${layout.width + PADDING * 2} ${layout.height + PADDING * 2}`}
      className="w-full h-auto"
    >
      {/* エッジを先に描画（ノードの下に表示） */}
      {layout.edges.map((edge) => (
        <RelationEdge
          key={`${edge.from}-${edge.to}`}
          from={edge.from}
          to={edge.to}
          type={edge.type}
          label={edge.label}
          points={edge.points}
        />
      ))}

      {/* ノード */}
      {layout.nodes.map((node) => {
        const term = termMap.get(node.termId);
        if (!term) return null;
        return (
          <TermNode
            key={node.termId}
            termId={node.termId}
            jaName={term.jaName}
            enName={term.enName}
            x={node.x}
            y={node.y}
          />
        );
      })}
    </svg>
  );
}
