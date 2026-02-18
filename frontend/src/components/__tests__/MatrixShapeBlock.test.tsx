import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatrixShapeBlock } from '../visual-explanations/exam-hints/MatrixShapeBlock';

describe('MatrixShapeBlock', () => {
  it('行列名ラベルを描画する', () => {
    render(
      <MatrixShapeBlock label="X" rows="N" cols="D" rowColor="#3B82F6" colColor="#10B981" />,
    );
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('行ラベルと列ラベルを描画する', () => {
    render(
      <MatrixShapeBlock label="W" rows="D" cols="M" rowColor="#3B82F6" colColor="#10B981" />,
    );
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('矩形ブロックのaria-labelに形状情報を含む', () => {
    render(
      <MatrixShapeBlock label="X" rows="N" cols="D" rowColor="#3B82F6" colColor="#10B981" />,
    );
    expect(screen.getByLabelText('行列 X (N×D)')).toBeInTheDocument();
  });

  it('転置ラベルを表示できる', () => {
    render(
      <MatrixShapeBlock
        label="W"
        rows="M"
        cols="D"
        rowColor="#3B82F6"
        colColor="#10B981"
        superscript="T"
      />,
    );
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
