import type { TermRelation, LayoutNode, LayoutEdge, LayoutResult } from '@/types/concept-map';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 56;
const LEVEL_GAP = 90;
const NODE_GAP = 24;

/**
 * トポロジカルソート + BFSで各ノードの階層(level)を割り当てる
 *
 * 循環がある場合は残りのノードをlevel 0に割り当てる
 */
function assignLevels(
  termIds: string[],
  relations: TermRelation[],
): Map<string, number> {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of termIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const rel of relations) {
    if (!adjacency.has(rel.from) || !inDegree.has(rel.to)) continue;
    adjacency.get(rel.from)!.push(rel.to);
    inDegree.set(rel.to, (inDegree.get(rel.to) ?? 0) + 1);
  }

  const levels = new Map<string, number>();
  const queue: string[] = [];

  // 入次数0のノードをlevel 0として開始
  for (const id of termIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id);
      levels.set(id, 0);
    }
  }

  // BFSで階層割り当て
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;

    for (const next of adjacency.get(current) ?? []) {
      const newLevel = currentLevel + 1;
      // 最大のlevelを採用（複数の親がある場合）
      if (!levels.has(next) || levels.get(next)! < newLevel) {
        levels.set(next, newLevel);
      }

      inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }

  // 循環に含まれるノード（レベル未割り当て）はlevel 0
  for (const id of termIds) {
    if (!levels.has(id)) {
      levels.set(id, 0);
    }
  }

  return levels;
}

/**
 * 各階層内のノード順序を決定し座標を割り当てる
 */
function assignCoordinates(
  termIds: string[],
  levels: Map<string, number>,
): LayoutNode[] {
  // 階層ごとにグループ化
  const levelGroups = new Map<number, string[]>();
  for (const id of termIds) {
    const level = levels.get(id) ?? 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(id);
  }

  const maxNodesInLevel = Math.max(
    ...Array.from(levelGroups.values()).map((g) => g.length),
    1,
  );

  const nodes: LayoutNode[] = [];

  for (const [level, ids] of levelGroups.entries()) {
    const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * NODE_GAP;
    const maxWidth = maxNodesInLevel * NODE_WIDTH + (maxNodesInLevel - 1) * NODE_GAP;
    const startX = (maxWidth - totalWidth) / 2;

    for (let i = 0; i < ids.length; i++) {
      nodes.push({
        termId: ids[i],
        x: startX + i * (NODE_WIDTH + NODE_GAP),
        y: level * (NODE_HEIGHT + LEVEL_GAP),
        level,
      });
    }
  }

  return nodes;
}

/**
 * エッジの制御点を計算する（3次ベジェ曲線）
 */
function routeEdges(
  nodes: LayoutNode[],
  relations: TermRelation[],
): LayoutEdge[] {
  const nodeMap = new Map(nodes.map((n) => [n.termId, n]));

  return relations
    .filter((rel) => nodeMap.has(rel.from) && nodeMap.has(rel.to))
    .map((rel) => {
      const fromNode = nodeMap.get(rel.from)!;
      const toNode = nodeMap.get(rel.to)!;

      // ソースノード下端の中央
      const sx = fromNode.x + NODE_WIDTH / 2;
      const sy = fromNode.y + NODE_HEIGHT;

      // ターゲットノード上端の中央
      const tx = toNode.x + NODE_WIDTH / 2;
      const ty = toNode.y;

      // 制御点（中間の高さ）
      const midY = (sy + ty) / 2;

      return {
        from: rel.from,
        to: rel.to,
        type: rel.type,
        label: rel.label,
        points: [
          { x: sx, y: sy },
          { x: sx, y: midY },
          { x: tx, y: midY },
          { x: tx, y: ty },
        ],
      };
    });
}

/**
 * 用語IDと関係データからレイアウトを計算する純粋関数
 */
export function computeLayout(
  termIds: string[],
  relations: TermRelation[],
): LayoutResult {
  if (termIds.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const levels = assignLevels(termIds, relations);
  const nodes = assignCoordinates(termIds, levels);
  const edges = routeEdges(nodes, relations);

  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH));
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT));

  return {
    nodes,
    edges,
    width: maxX,
    height: maxY,
  };
}
