import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders plain text', () => {
    render(<MarkdownRenderer content="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders markdown headings', () => {
    render(<MarkdownRenderer content="# Heading 1" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Heading 1');
  });

  it('renders markdown bold text', () => {
    render(<MarkdownRenderer content="This is **bold** text" />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders markdown italic text', () => {
    render(<MarkdownRenderer content="This is *italic* text" />);
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('renders markdown lists', () => {
    render(
      <MarkdownRenderer content={`- Item 1\n- Item 2\n- Item 3`} />
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders code blocks with syntax highlighting', () => {
    const markdown = '```python\ndef hello():\n    print("world")\n```';
    const { container } = render(<MarkdownRenderer content={markdown} />);

    const codeElement = container.querySelector('code');
    expect(codeElement).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<MarkdownRenderer content="Use `const x = 1` for declaration" />);
    const inlineCode = screen.getByText('const x = 1');
    expect(inlineCode.tagName).toBe('CODE');
  });

  it('renders links', () => {
    render(
      <MarkdownRenderer content="Check [this link](https://example.com)" />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders images using ImageViewer', () => {
    render(
      <MarkdownRenderer content="![Alt text](/images/test.png)" />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Alt text');
  });

  it('handles empty content gracefully', () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="Test" className="custom-markdown" />
    );
    expect(container.firstChild).toHaveClass('custom-markdown');
  });
});
