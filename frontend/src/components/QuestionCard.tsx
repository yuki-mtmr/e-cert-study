'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ExplanationChat } from './ExplanationChat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedIndex: number) => void;
  showResult?: boolean;
  selectedAnswer?: number;
  isCorrect?: boolean;
}

/**
 * 問題カードコンポーネント
 * 問題文と選択肢を表示し、回答を受け付ける
 *
 * contentTypeに応じてMarkdown/コード/プレーンテキストを表示
 */
export function QuestionCard({
  question,
  onAnswer,
  showResult = false,
  selectedAnswer,
  isCorrect,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(
    selectedAnswer ?? null
  );

  // 問題が変わったら選択状態をリセット
  useEffect(() => {
    setSelected(selectedAnswer ?? null);
  }, [question.id, selectedAnswer]);

  const handleChoiceClick = (index: number) => {
    if (!showResult) {
      setSelected(index);
    }
  };

  const handleSubmit = () => {
    if (selected !== null) {
      onAnswer(selected);
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  // contentTypeに応じたコンテンツレンダリング
  const renderContent = (content: string) => {
    const contentType = question.contentType || 'plain';

    if (contentType === 'plain') {
      return <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{content}</h2>;
    }

    // markdownまたはcodeの場合はMarkdownRendererを使用
    return <MarkdownRenderer content={content} />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:shadow-gray-900/20 rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>出典: {question.source}</span>
          {question.topic && (
            <span
              data-testid="topic-badge"
              className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded"
            >
              {question.topic}
            </span>
          )}
        </div>
        <span>難易度: {getDifficultyStars(question.difficulty)}</span>
      </div>

      {/* 問題文 */}
      <div className="mb-6">
        {renderContent(question.content)}
      </div>

      {/* 画像表示 */}
      {question.images && question.images.length > 0 && (
        <div className="mb-6 space-y-4">
          {question.images.map((image) => (
            <figure key={image.id} className="text-center">
              <img
                src={`${API_BASE_URL}/api/questions/${question.id}/images/${image.id}`}
                alt={image.altText || '問題画像'}
                className="max-w-full h-auto mx-auto rounded-lg"
              />
              {image.altText && (
                <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {image.altText}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* 選択肢 */}
      <div className="space-y-3 mb-6">
        {question.choices.map((choice, index) => {
          const isSelected = selected === index;
          const isCorrectAnswer = question.correctAnswer === index;

          let buttonClass = 'w-full text-left p-4 rounded-lg border transition-colors ';

          if (showResult) {
            if (isCorrectAnswer) {
              buttonClass += 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-300';
            } else if (isSelected && !isCorrectAnswer) {
              buttonClass += 'bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-300';
            } else {
              buttonClass += 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
            }
          } else {
            buttonClass += isSelected
              ? 'selected bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-800 dark:text-blue-300'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300';
          }

          const contentType = question.contentType || 'plain';

          return (
            <button
              key={index}
              onClick={() => handleChoiceClick(index)}
              className={buttonClass}
              disabled={showResult}
            >
              <span className="font-medium mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              {contentType === 'plain' ? (
                choice
              ) : (
                <span className="inline">
                  <MarkdownRenderer content={choice} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 回答ボタン / 結果表示 */}
      {showResult ? (
        <div className="space-y-4">
          {/* 正誤表示 */}
          <div
            className={`p-4 rounded-lg ${
              isCorrect
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
            }`}
          >
            <p
              className={`font-bold text-lg ${
                isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}
            >
              {isCorrect ? '正解!' : '不正解'}
            </p>
            {!isCorrect && (
              <div className="text-gray-700 dark:text-gray-300 mt-1">
                正解は「
                {(question.contentType || 'plain') === 'plain' ? (
                  question.choices[question.correctAnswer]
                ) : (
                  <span className="inline">
                    <MarkdownRenderer content={question.choices[question.correctAnswer]} />
                  </span>
                )}
                」です。
              </div>
            )}
          </div>

          {/* 解説 */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">解説</h3>
            <MarkdownRenderer content={question.explanation} />
          </div>

          {/* 追加質問チャット */}
          <ExplanationChat question={question} />
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            selected !== null
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          回答する
        </button>
      )}
    </div>
  );
}
