'use client';

import { useState } from 'react';
import type { LayoutResult } from '@/types/concept-map';
import type { GlossaryTerm, TermExamPoints } from '@/types/glossary';
import { TermNode } from './TermNode';
import { RelationEdge } from './RelationEdge';
import { TermTooltip } from './TermTooltip';

interface SubsectionMapProps {
  layout: LayoutResult;
  terms: GlossaryTerm[];
  examPoints: TermExamPoints[];
}

const PADDING = 20;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;

/** サブセクション用語関係マップのSVGコンテナ */
export function SubsectionMap({ layout, terms, examPoints }: SubsectionMapProps) {
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const termMap = new Map(terms.map((t) => [t.id, t]));
  const examPointsMap = new Map(examPoints.map((ep) => [ep.termId, ep]));

  const handleNodeClick = (termId: string) => {
    setSelectedTermId((prev) => (prev === termId ? null : termId));
  };

  const handleClose = () => {
    setSelectedTermId(null);
  };

  const selectedNode = selectedTermId
    ? layout.nodes.find((n) => n.termId === selectedTermId)
    : null;
  const selectedTerm = selectedTermId ? termMap.get(selectedTermId) : null;
  const selectedExamPoints = selectedTermId ? examPointsMap.get(selectedTermId) : null;

  return (
    <div className="relative">
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
              selected={node.termId === selectedTermId}
              onClick={handleNodeClick}
            />
          );
        })}
      </svg>

      {selectedNode && selectedTerm && selectedExamPoints && (
        <TermTooltip
          jaName={selectedTerm.jaName}
          examPoints={selectedExamPoints}
          x={selectedNode.x + NODE_WIDTH + PADDING}
          y={selectedNode.y + NODE_HEIGHT / 2}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
