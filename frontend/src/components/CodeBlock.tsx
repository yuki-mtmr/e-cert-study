'use client';

import { useMemo } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

/**
 * シンタックスハイライト付きコードブロックコンポーネント
 *
 * hljs.highlight()でHTML文字列を生成しdangerouslySetInnerHTMLで描画。
 * DOM直接操作を避けることでReactとの競合（点滅）を防止。
 */
export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const highlighted = useMemo(() => {
    if (language) {
      try {
        return hljs.highlight(code, { language }).value;
      } catch {
        // 不明言語の場合はフォールバック
      }
    }
    return null;
  }, [code, language]);

  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 my-4">
      {filename && (
        <div className="px-4 py-2 bg-gray-800 text-gray-300 text-sm font-mono border-b border-gray-700">
          {filename}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code
          className={language ? `language-${language} hljs` : undefined}
          {...(highlighted
            ? { dangerouslySetInnerHTML: { __html: highlighted } }
            : { children: code })}
        />
      </pre>
    </div>
  );
}
