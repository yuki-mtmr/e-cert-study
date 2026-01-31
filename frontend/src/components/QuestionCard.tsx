'use client';

import { useState } from 'react';
import type { Question } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';

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
      return <h2 className="text-lg font-medium text-gray-900">{content}</h2>;
    }

    // markdownまたはcodeの場合はMarkdownRendererを使用
    return <MarkdownRenderer content={content} />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>出典: {question.source}</span>
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
                src={`/api/questions/${question.id}/images/${image.id}`}
                alt={image.altText || '問題画像'}
                className="max-w-full h-auto mx-auto rounded-lg"
              />
              {image.altText && (
                <figcaption className="text-sm text-gray-600 mt-2">
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
              buttonClass += 'bg-green-100 border-green-500 text-green-800';
            } else if (isSelected && !isCorrectAnswer) {
              buttonClass += 'bg-red-100 border-red-500 text-red-800';
            } else {
              buttonClass += 'bg-gray-50 border-gray-200 text-gray-600';
            }
          } else {
            buttonClass += isSelected
              ? 'selected bg-blue-100 border-blue-500 text-blue-800'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700';
          }

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
              {choice}
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
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`font-bold text-lg ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isCorrect ? '正解!' : '不正解'}
            </p>
            {!isCorrect && (
              <p className="text-gray-700 mt-1">
                正解は「{question.choices[question.correctAnswer]}」です。
              </p>
            )}
          </div>

          {/* 解説 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">解説</h3>
            {(question.contentType || 'plain') === 'plain' ? (
              <p className="text-gray-700">{question.explanation}</p>
            ) : (
              <MarkdownRenderer content={question.explanation} />
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            selected !== null
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          回答する
        </button>
      )}
    </div>
  );
}
