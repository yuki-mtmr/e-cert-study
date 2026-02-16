interface TermNodeProps {
  termId: string;
  jaName: string;
  enName: string;
  x: number;
  y: number;
}

/** 用語ノードのSVGコンポーネント */
export function TermNode({ jaName, enName, x, y }: TermNodeProps) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={160}
        height={56}
        rx={10}
        className="fill-white stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-500"
        strokeWidth={1.5}
      />
      <text
        x={80}
        y={22}
        textAnchor="middle"
        className="fill-gray-900 dark:fill-gray-100"
        fontSize={12}
        fontWeight="bold"
      >
        {jaName}
      </text>
      <text
        x={80}
        y={40}
        textAnchor="middle"
        className="fill-gray-500 dark:fill-gray-400"
        fontSize={9}
      >
        {enName}
      </text>
    </g>
  );
}
