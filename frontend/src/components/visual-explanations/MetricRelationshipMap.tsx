'use client';

import { useState, useMemo } from 'react';
import {
  getMetricNodes,
  getMetricEdges,
  getCategoryColor,
} from '@/lib/visual-explanations/metric-relationship-data';
import type { MetricNode, MetricCategory } from '@/lib/visual-explanations/metric-relationship-data';

const WIDTH = 700;
const HEIGHT = 500;
const PAD = 40;
const NODE_RX = 45;
const NODE_RY = 22;

function toX(nx: number): number {
  return PAD + nx * (WIDTH - 2 * PAD);
}
function toY(ny: number): number {
  return PAD + ny * (HEIGHT - 2 * PAD);
}

const LEGEND: { category: MetricCategory; label: string }[] = [
  { category: 'base', label: '混同行列要素' },
  { category: 'rate', label: '基本指標' },
  { category: 'composite', label: '複合指標' },
  { category: 'curve', label: '曲線ベース' },
];

/** 評価指標の関係マップ（インタラクティブSVG） */
export function MetricRelationshipMap() {
  const nodes = useMemo(() => getMetricNodes(), []);
  const edges = useMemo(() => getMetricEdges(), []);
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const [selectedNode, setSelectedNode] = useState<MetricNode | null>(null);

  const handleNodeClick = (node: MetricNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  // 選択ノードに接続するエッジのID集合
  const connectedEdgeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(
      edges
        .map((e, i) => ({ edge: e, idx: i }))
        .filter(({ edge: e }) => e.from === selectedNode.id || e.to === selectedNode.id)
        .map(({ idx }) => `edge-${idx}`),
    );
  }, [selectedNode, edges]);

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="評価指標の関係マップ"
      >
        {/* エッジ */}
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          const isHighlighted = connectedEdgeIds.has(`edge-${i}`);
          return (
            <line
              key={`edge-${i}`}
              data-testid={`edge-${i}`}
              x1={toX(from.x)}
              y1={toY(from.y)}
              x2={toX(to.x)}
              y2={toY(to.y)}
              stroke={isHighlighted ? '#F59E0B' : '#D1D5DB'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeOpacity={isHighlighted ? 1 : 0.5}
            />
          );
        })}

        {/* ノード */}
        {nodes.map((node) => {
          const cx = toX(node.x);
          const cy = toY(node.y);
          const color = getCategoryColor(node.category);
          const isSelected = selectedNode?.id === node.id;

          return (
            <g
              key={node.id}
              data-testid={`node-${node.id}`}
              onClick={() => handleNodeClick(node)}
              className="cursor-pointer"
            >
              <ellipse
                cx={cx}
                cy={cy}
                rx={NODE_RX}
                ry={NODE_RY}
                fill={color}
                fillOpacity={isSelected ? 1 : 0.15}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-bold"
                fill={isSelected ? 'white' : color}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ポップアップ */}
      {selectedNode && (
        <div
          data-testid="node-popup"
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm space-y-2"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getCategoryColor(selectedNode.category) }}
            />
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {selectedNode.label}
            </span>
            <span className="text-xs text-gray-500">({selectedNode.enLabel})</span>
          </div>
          {selectedNode.formula && (
            <div className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded">
              {selectedNode.formula}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedNode.description}
          </div>
        </div>
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 text-xs">
        {LEGEND.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getCategoryColor(item.category) }}
            />
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
