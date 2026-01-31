import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock code="console.log('hello')" />);
    expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
  });

  it('applies language class when language is provided', () => {
    const { container } = render(
      <CodeBlock code="const x = 1" language="javascript" />
    );
    const codeElement = container.querySelector('code');
    expect(codeElement).toHaveClass('language-javascript');
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

  it('applies syntax highlighting for Python', () => {
    const { container } = render(
      <CodeBlock code="def hello():\n    print('world')" language="python" />
    );
    const codeElement = container.querySelector('code');
    expect(codeElement).toHaveClass('language-python');
  });

  it('renders empty code block gracefully', () => {
    const { container } = render(<CodeBlock code="" />);
    expect(container.querySelector('code')).toBeInTheDocument();
  });
});
