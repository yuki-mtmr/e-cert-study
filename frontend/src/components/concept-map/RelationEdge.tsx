import type { RelationType } from '@/types/concept-map';

const EDGE_COLORS: Record<RelationType, string> = {
  prerequisite: '#94a3b8',
  variant: '#3b82f6',
  component: '#22c55e',
  applies: '#f59e0b',
};

interface RelationEdgeProps {
  from: string;
  to: string;
  type: RelationType;
  label?: string;
  points: { x: number; y: number }[];
}

/** 関係矢印のSVGコンポーネント */
export function RelationEdge({ from, to, type, label, points }: RelationEdgeProps) {
  if (points.length < 2) return null;

  const color = EDGE_COLORS[type];
  const markerId = `arrow-${from}-${to}`;

  // 3次ベジェ曲線パス
  const [start, cp1, cp2, end] = points.length >= 4
    ? points
    : [points[0], points[0], points[points.length - 1], points[points.length - 1]];

  const d = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  // ラベル位置（パスの中央）
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          markerWidth={8}
          markerHeight={6}
          refX={8}
          refY={3}
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={midX}
          y={midY - 4}
          textAnchor="middle"
          fontSize={8}
          className="fill-gray-600 dark:fill-gray-300"
        >
          {label}
        </text>
      )}
    </g>
  );
}
