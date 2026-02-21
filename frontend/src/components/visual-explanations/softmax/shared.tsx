'use client';

export function MatrixGrid({
  data,
  highlight,
}: {
  data: number[][];
  highlight?: boolean;
}) {
  return (
    <div className="inline-flex flex-col gap-0.5">
      {data.map((row, r) => (
        <div key={r} className="flex gap-0.5">
          {row.map((v, c) => (
            <Cell key={c} value={v} highlight={highlight} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Cell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={`inline-block w-12 text-center font-mono text-xs py-0.5 rounded ${
        highlight
          ? 'bg-indigo-100 dark:bg-indigo-900/30'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}
    >
      {value.toFixed(1)}
    </span>
  );
}

export function FlowBox({
  label,
  color,
  highlight,
}: {
  label: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-mono border ${
        highlight ? 'ring-2 ring-offset-1' : ''
      }`}
      style={{ borderColor: color, color }}
    >
      {label}
    </span>
  );
}

export function Arrow() {
  return <span className="text-gray-400">→</span>;
}

export function KeyPoint({ text }: { text: string }) {
  return (
    <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-800 dark:text-blue-200">
      {text}
    </div>
  );
}
