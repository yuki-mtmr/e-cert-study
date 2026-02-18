interface MatrixShapeBlockProps {
  label: string;
  rows: string;
  cols: string;
  rowColor: string;
  colColor: string;
  /** 転置記号（例: "T"） */
  superscript?: string;
}

/** 行列の形状を色付き矩形で表現する共通部品 */
export function MatrixShapeBlock({
  label,
  rows,
  cols,
  rowColor,
  colColor,
  superscript,
}: MatrixShapeBlockProps) {
  return (
    <div
      className="inline-flex flex-col items-center gap-1"
      aria-label={`行列 ${label} (${rows}×${cols})`}
    >
      {/* ラベル */}
      <div className="text-sm font-bold">
        {label}
        {superscript && (
          <sup className="text-xs ml-0.5">{superscript}</sup>
        )}
      </div>

      {/* 列ラベル */}
      <div className="text-xs font-mono" style={{ color: colColor }}>
        {cols}
      </div>

      {/* 矩形ブロック */}
      <div className="flex items-center gap-1">
        {/* 行ラベル */}
        <div className="text-xs font-mono" style={{ color: rowColor }}>
          {rows}
        </div>
        {/* 形状ブロック */}
        <div
          className="rounded border-2"
          style={{
            borderColor: rowColor,
            background: `linear-gradient(135deg, ${rowColor}15, ${colColor}15)`,
            width: 48,
            height: 36,
          }}
        />
      </div>
    </div>
  );
}
