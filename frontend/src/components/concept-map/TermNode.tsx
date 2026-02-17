interface TermNodeProps {
  termId: string;
  jaName: string;
  enName: string;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: (termId: string) => void;
}

/** 用語ノードのSVGコンポーネント */
export function TermNode({ termId, jaName, enName, x, y, selected, onClick }: TermNodeProps) {
  const rectClass = selected
    ? 'fill-blue-50 stroke-blue-500 dark:fill-blue-900 dark:stroke-blue-400'
    : 'fill-white stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-500';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick?.(termId)}
      className="cursor-pointer"
    >
      <rect
        width={160}
        height={56}
        rx={10}
        className={rectClass}
        strokeWidth={selected ? 2 : 1.5}
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
