'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

/**
 * シンタックスハイライト付きコードブロックコンポーネント
 */
export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && language) {
      hljs.highlightElement(codeRef.current);
    }
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
          ref={codeRef}
          className={language ? `language-${language}` : undefined}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}
