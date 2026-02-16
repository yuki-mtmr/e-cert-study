/**
 * 問題カードコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from '../QuestionCard';
import type { Question } from '@/types';

const mockQuestion: Question = {
  id: '1',
  categoryId: 'cat1',
  content: 'ニューラルネットワークにおいて、活性化関数の役割は何か？',
  choices: [
    '入力データの正規化',
    '非線形性の導入',
    '損失関数の計算',
    '勾配の計算',
  ],
  correctAnswer: 1,
  explanation: '活性化関数は、ニューラルネットワークに非線形性を導入することで、複雑なパターンを学習可能にします。',
  difficulty: 3,
  source: 'E資格対策問題集',
  contentType: 'plain',
  images: [],
};

describe('QuestionCard', () => {
  it('問題文を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText(/ニューラルネットワークにおいて/)).toBeInTheDocument();
  });

  it('選択肢を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText('入力データの正規化')).toBeInTheDocument();
    expect(screen.getByText('非線形性の導入')).toBeInTheDocument();
    expect(screen.getByText('損失関数の計算')).toBeInTheDocument();
    expect(screen.getByText('勾配の計算')).toBeInTheDocument();
  });

  it('選択肢をクリックすると選択状態になる', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);

    expect(choice.closest('button')).toHaveClass('selected');
  });

  it('回答ボタンをクリックするとonAnswerが呼ばれる', () => {
    const onAnswer = vi.fn();
    render(<QuestionCard question={mockQuestion} onAnswer={onAnswer} />);

    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);

    const submitButton = screen.getByRole('button', { name: /回答する/i });
    fireEvent.click(submitButton);

    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('選択していない場合は回答ボタンが無効', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /回答する/i });
    expect(submitButton).toBeDisabled();
  });

  it('回答後に正誤と解説を表示する', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswer={1}
        isCorrect={true}
      />
    );

    expect(screen.getByText(/正解/)).toBeInTheDocument();
    expect(screen.getByText(/活性化関数は、ニューラルネットワーク/)).toBeInTheDocument();
  });

  it('不正解の場合は正解を示す', () => {
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswer={0}
        isCorrect={false}
      />
    );

    expect(screen.getByText(/不正解/)).toBeInTheDocument();
    expect(screen.getByText(/正解は「非線形性の導入」/)).toBeInTheDocument();
  });

  it('難易度を表示する', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    expect(screen.getByText(/難易度/)).toBeInTheDocument();
  });

  it('画像URLにAPIベースURLが含まれる', () => {
    const questionWithImage: Question = {
      ...mockQuestion,
      images: [
        {
          id: 'img1',
          questionId: '1',
          filePath: '/images/test.png',
          altText: 'テスト画像',
          position: 0,
          imageType: 'question',
        },
      ],
    };
    render(<QuestionCard question={questionWithImage} onAnswer={vi.fn()} />);

    const img = screen.getByAltText('テスト画像');
    // 画像URLはAPIベースURL（localhost:8000など）を含むべき
    expect(img.getAttribute('src')).toMatch(/^https?:\/\/.+\/api\/questions/);
  });

  it('contentType=plainでも解説はMarkdownRendererで表示される', () => {
    const markdownExplanation = '### 正解を導く手順\n\n活性化関数の役割を考えましょう。\n\n### 選択肢の比較\n\n各選択肢を比較します。';
    const questionWithMarkdownExplanation: Question = {
      ...mockQuestion,
      contentType: 'plain',
      explanation: markdownExplanation,
    };

    render(
      <QuestionCard
        question={questionWithMarkdownExplanation}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswer={1}
        isCorrect={true}
      />
    );

    // 解説セクションが表示される
    expect(screen.getByText('解説')).toBeInTheDocument();
    // Markdownがレンダリングされている（h3ヘッダーが存在する）
    const headings = document.querySelectorAll('h3');
    const explanationHeadings = Array.from(headings).filter(
      h => h.textContent === '正解を導く手順' || h.textContent === '選択肢の比較'
    );
    expect(explanationHeadings.length).toBeGreaterThan(0);
  });

  it('topicがある場合はバッジを表示する', () => {
    const questionWithTopic: Question = {
      ...mockQuestion,
      topic: 'バッチ正規化',
    };
    render(<QuestionCard question={questionWithTopic} onAnswer={vi.fn()} />);

    expect(screen.getByText('バッチ正規化')).toBeInTheDocument();
  });

  it('topicがない場合はバッジを表示しない', () => {
    render(<QuestionCard question={mockQuestion} onAnswer={vi.fn()} />);

    // topicバッジが表示されないことを確認
    expect(screen.queryByTestId('topic-badge')).not.toBeInTheDocument();
  });

  it('問題が変わると選択状態がリセットされる', () => {
    const newQuestion: Question = {
      ...mockQuestion,
      id: '2',
      content: '別の問題',
    };

    const { rerender } = render(
      <QuestionCard question={mockQuestion} onAnswer={vi.fn()} />
    );

    // 最初の問題で選択肢をクリック
    const choice = screen.getByText('非線形性の導入');
    fireEvent.click(choice);
    expect(choice.closest('button')).toHaveClass('selected');

    // 問題を切り替え
    rerender(<QuestionCard question={newQuestion} onAnswer={vi.fn()} />);

    // 選択状態がリセットされていることを確認
    const choiceAfterRerender = screen.getByText('非線形性の導入');
    expect(choiceAfterRerender.closest('button')).not.toHaveClass('selected');

    // 回答ボタンが無効になっていることを確認
    const submitButton = screen.getByRole('button', { name: /回答する/i });
    expect(submitButton).toBeDisabled();
  });
});
