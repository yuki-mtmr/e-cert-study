'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';
import { ImageViewer } from './ImageViewer';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown/LaTeX/画像/コード統合表示コンポーネント
 *
 * 以下を統合表示:
 * - Markdown (GFM対応)
 * - LaTeX数式 ($...$ と $$...$$)
 * - シンタックスハイライト付きコードブロック
 * - 拡大可能な画像
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // コードブロックのカスタムレンダリング
          code({ node, className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isInline = !match && !codeClassName;

            if (isInline) {
              return (
                <code
                  className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match?.[1]}
              />
            );
          },

          // preタグはCodeBlockが処理するので無視
          pre({ children }) {
            return <>{children}</>;
          },

          // 画像のカスタムレンダリング
          img({ node, src, alt, ...props }) {
            if (!src || typeof src !== 'string') return null;
            return (
              <ImageViewer
                src={src}
                alt={alt || ''}
                caption={alt}
              />
            );
          },

          // 見出しのスタイリング
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">
                {children}
              </h3>
            );
          },

          // 段落
          p({ children }) {
            return <p className="my-3 text-gray-800 leading-relaxed">{children}</p>;
          },

          // リスト
          ul({ children }) {
            return <ul className="my-3 ml-6 list-disc text-gray-800">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 ml-6 list-decimal text-gray-800">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-1">{children}</li>;
          },

          // リンク
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },

          // 引用
          blockquote({ children }) {
            return (
              <blockquote className="my-4 pl-4 border-l-4 border-gray-300 italic text-gray-600">
                {children}
              </blockquote>
            );
          },

          // 水平線
          hr() {
            return <hr className="my-6 border-gray-300" />;
          },

          // テーブル
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 px-4 py-2">{children}</td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
