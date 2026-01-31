import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewer } from '../ImageViewer';

describe('ImageViewer', () => {
  const defaultProps = {
    src: '/api/questions/123/images/456',
    alt: 'Test image',
  };

  it('renders image with correct src', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', defaultProps.src);
  });

  it('renders image with alt text', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', defaultProps.alt);
  });

  it('opens modal when image is clicked', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    fireEvent.click(img);

    // Modal should be visible with enlarged image
    const modalImage = screen.getAllByRole('img')[1]; // Second image is in modal
    expect(modalImage).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    fireEvent.click(img);

    // Find and click close button
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    // Modal should be closed (only one image visible)
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
  });

  it('closes modal when clicking outside the image', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    fireEvent.click(img);

    // Click on the modal backdrop
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    // Modal should be closed
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
  });

  it('renders caption when provided', () => {
    render(<ImageViewer {...defaultProps} caption="Figure 1: Neural network" />);
    expect(screen.getByText('Figure 1: Neural network')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ImageViewer {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('closes modal on Escape key press', () => {
    render(<ImageViewer {...defaultProps} />);
    const img = screen.getByRole('img');
    fireEvent.click(img);

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Modal should be closed
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
  });
});
