import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApMapExplanation } from '../visual-explanations/ApMapExplanation';

describe('ApMapExplanation', () => {
  it('タイトルを表示する', () => {
    render(<ApMapExplanation />);
    expect(screen.getByText('AP (Average Precision) と mAP')).toBeInTheDocument();
  });

  it('3クラスのAPを表示する', () => {
    render(<ApMapExplanation />);
    const apValues = screen.getAllByTestId('class-ap');
    expect(apValues.length).toBe(3);
  });

  it('mAP値を表示する', () => {
    render(<ApMapExplanation />);
    expect(screen.getByTestId('map-value')).toBeInTheDocument();
  });

  it('スライダーを操作できる', () => {
    render(<ApMapExplanation />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1.5' } });
    expect(slider).toBeInTheDocument();
  });
});
