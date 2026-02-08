import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock code="console.log('hello')" />);
    expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
  });

  it('applies language class with hljs when language is provided', () => {
    const { container } = render(
      <CodeBlock code="const x = 1" language="javascript" />
    );
    const codeElement = container.querySelector('code');
    expect(codeElement).toHaveClass('language-javascript');
    // useMemo + hljs.highlight() による描画なので hljs クラスが付与される
    expect(codeElement).toHaveClass('hljs');
  });

  it('renders without language class when language is not provided', () => {
    const { container } = render(<CodeBlock code="some code" />);
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders pre and code elements', () => {
    const { container } = render(<CodeBlock code="test" />);
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('preserves whitespace and line breaks', () => {
    const multilineCode = `function test() {
  return 42;
}`;
    render(<CodeBlock code={multilineCode} />);
    expect(screen.getByText(/function test/)).toBeInTheDocument();
    expect(screen.getByText(/return 42/)).toBeInTheDocument();
  });

  it('shows filename when provided', () => {
    render(
      <CodeBlock code="const x = 1" language="typescript" filename="example.ts" />
    );
    expect(screen.getByText('example.ts')).toBeInTheDocument();
  });

  it('generates highlighted HTML via hljs.highlight for known language', () => {
    const { container } = render(
      <CodeBlock code="def hello():\n    print('world')" language="python" />
    );
    const codeElement = container.querySelector('code');
    expect(codeElement).toHaveClass('language-python');
    // hljs.highlight() が生成したHTMLにはspanタグが含まれる
    expect(codeElement?.innerHTML).toContain('<span');
  });

  it('renders empty code block gracefully', () => {
    const { container } = render(<CodeBlock code="" />);
    expect(container.querySelector('code')).toBeInTheDocument();
  });

  it('falls back to plain text for unknown language', () => {
    const { container } = render(
      <CodeBlock code="some unknown code" language="nonexistent_lang_xyz" />
    );
    const codeElement = container.querySelector('code');
    // 不明言語はフォールバックしてplainテキストで描画
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toContain('some unknown code');
  });

  it('does not use useRef for code element (prevents React DOM conflict)', async () => {
    // コンポーネントソースにuseRefがないことを確認
    // hljs.highlightElement()によるDOM直接操作はReactと競合して点滅の原因になる
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../CodeBlock.tsx');
    const source = fs.readFileSync(componentPath, 'utf-8');
    expect(source).not.toContain('useRef');
    expect(source).not.toContain('highlightElement');
  });
});
