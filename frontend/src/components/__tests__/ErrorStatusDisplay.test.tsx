import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorStatusDisplay } from '../visual-explanations/ErrorStatusDisplay';

describe('ErrorStatusDisplay', () => {
  it('訓練誤差の値を表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.3}
        generalizationError={0.5}
        fittingState="optimal"
      />,
    );
    expect(screen.getByText('0.30')).toBeInTheDocument();
  });

  it('汎化誤差の値を表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.3}
        generalizationError={0.5}
        fittingState="optimal"
      />,
    );
    expect(screen.getByText('0.50')).toBeInTheDocument();
  });

  it('訓練誤差ラベルを表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.3}
        generalizationError={0.5}
        fittingState="optimal"
      />,
    );
    expect(screen.getByText('訓練誤差')).toBeInTheDocument();
  });

  it('汎化誤差ラベルを表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.3}
        generalizationError={0.5}
        fittingState="optimal"
      />,
    );
    expect(screen.getByText('汎化誤差')).toBeInTheDocument();
  });

  it('underfitting 状態で「過少適合」を表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.8}
        generalizationError={0.9}
        fittingState="underfitting"
      />,
    );
    expect(screen.getByText('過少適合')).toBeInTheDocument();
  });

  it('optimal 状態で「最適」を表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.2}
        generalizationError={0.3}
        fittingState="optimal"
      />,
    );
    expect(screen.getByText(/最適/)).toBeInTheDocument();
  });

  it('overfitting 状態で「過剰適合」を表示する', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.05}
        generalizationError={0.8}
        fittingState="overfitting"
      />,
    );
    expect(screen.getByText(/過剰適合/)).toBeInTheDocument();
  });

  it('誤差バーを描画する（testid で確認）', () => {
    render(
      <ErrorStatusDisplay
        trainingError={0.3}
        generalizationError={0.5}
        fittingState="optimal"
      />,
    );
    expect(screen.getByTestId('training-error-bar')).toBeInTheDocument();
    expect(screen.getByTestId('generalization-error-bar')).toBeInTheDocument();
  });
});
