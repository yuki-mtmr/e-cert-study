'use client';

import { useState, useMemo } from 'react';
import { getQuizQuestions } from '@/lib/visual-explanations/micro-macro-average';
import type { QuizQuestion } from '@/lib/visual-explanations/micro-macro-average';

type AnswerChoice = 'macro' | 'micro' | 'either';

const CHOICES: { value: AnswerChoice; label: string }[] = [
  { value: 'macro', label: 'マクロ平均' },
  { value: 'micro', label: 'マイクロ平均' },
  { value: 'either', label: 'どちらでも同じ' },
];

/** 5問シナリオクイズ */
export function AverageQuizGame() {
  const questions = useMemo(() => getQuizQuestions(), []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerChoice | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current: QuizQuestion = questions[currentIdx];
  const isCorrect = selectedAnswer === current.correctAnswer;

  const handleAnswer = (answer: AnswerChoice) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    if (answer === current.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
    }
  };

  if (finished) {
    return (
      <div data-testid="quiz-score" className="text-center space-y-3 p-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {score} / {questions.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {score === questions.length
            ? '全問正解！'
            : score >= 3
              ? 'よくできました！'
              : 'もう一度復習しましょう'}
        </div>
        <button
          onClick={() => {
            setCurrentIdx(0);
            setSelectedAnswer(null);
            setScore(0);
            setFinished(false);
          }}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
        >
          もう一度
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 進捗 */}
      <div className="text-xs text-gray-500">
        {currentIdx + 1} / {questions.length}
      </div>

      {/* シナリオ */}
      <div
        data-testid="quiz-scenario"
        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
      >
        <div className="text-lg mb-2">{current.icon}</div>
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {current.scenario}
        </div>
      </div>

      {/* 回答ボタン */}
      <div className="flex flex-wrap gap-2">
        {CHOICES.map((choice) => {
          const isSelected = selectedAnswer === choice.value;
          const isCorrectChoice = choice.value === current.correctAnswer;
          let btnColor = 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
          if (selectedAnswer !== null) {
            if (isCorrectChoice) {
              btnColor = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
            } else if (isSelected && !isCorrectChoice) {
              btnColor = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            }
          }
          return (
            <button
              key={choice.value}
              onClick={() => handleAnswer(choice.value)}
              disabled={selectedAnswer !== null}
              className={`px-4 py-2 rounded text-sm transition-colors ${btnColor}`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {/* 解説 */}
      {selectedAnswer !== null && (
        <div data-testid="quiz-explanation" className="space-y-2">
          <div
            className={`text-sm font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {isCorrect ? '正解！' : '不正解'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {current.explanation}
          </div>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm"
          >
            {currentIdx + 1 >= questions.length ? '結果を見る' : '次へ'}
          </button>
        </div>
      )}
    </div>
  );
}
