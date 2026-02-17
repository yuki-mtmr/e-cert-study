import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualizationContainer } from '../visual-explanations/VisualizationContainer';
import type { VisualizationMeta } from '@/lib/visual-explanations/registry';

function MockComponent() {
  return <div data-testid="mock-viz">Mock Viz</div>;
}

const sampleVisualizations: VisualizationMeta[] = [
  {
    id: 'test-viz',
    title: 'テストタイトル',
    description: 'テスト説明文',
    component: MockComponent,
  },
];

describe('VisualizationContainer', () => {
  it('タイトルを表示する', () => {
    render(<VisualizationContainer visualizations={sampleVisualizations} />);
    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
  });

  it('説明文を表示する', () => {
    render(<VisualizationContainer visualizations={sampleVisualizations} />);
    expect(screen.getByText('テスト説明文')).toBeInTheDocument();
  });

  it('ビジュアルコンポーネントを描画する', () => {
    render(<VisualizationContainer visualizations={sampleVisualizations} />);
    expect(screen.getByTestId('mock-viz')).toBeInTheDocument();
  });

  it('複数のビジュアルを描画する', () => {
    const multiple: VisualizationMeta[] = [
      ...sampleVisualizations,
      {
        id: 'test-viz-2',
        title: '第2のタイトル',
        description: '第2の説明',
        component: () => <div data-testid="mock-viz-2">Second</div>,
      },
    ];
    render(<VisualizationContainer visualizations={multiple} />);
    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText('第2のタイトル')).toBeInTheDocument();
  });
});
