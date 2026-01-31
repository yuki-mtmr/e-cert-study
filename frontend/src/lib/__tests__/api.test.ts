/**
 * APIクライアントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchQuestions,
  fetchQuestionById,
  fetchRandomQuestion,
  fetchSmartQuestion,
  submitAnswer,
  fetchCategories,
} from '../api';
import type { Question, Answer } from '@/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchQuestions', () => {
    it('問題一覧を取得できる', async () => {
      const mockQuestions: Question[] = [
        {
          id: '1',
          categoryId: 'cat1',
          content: 'テスト問題',
          choices: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: '解説',
          difficulty: 3,
          source: 'テスト',
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions,
      });

      const result = await fetchQuestions();

      expect(result).toEqual(mockQuestions);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions'),
        expect.any(Object)
      );
    });

    it('カテゴリでフィルタリングできる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchQuestions({ categoryId: 'cat1' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category_id=cat1'),
        expect.any(Object)
      );
    });
  });

  describe('fetchQuestionById', () => {
    it('IDで問題を取得できる', async () => {
      const mockQuestion: Question = {
        id: '1',
        categoryId: 'cat1',
        content: 'テスト問題',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '解説',
        difficulty: 3,
        source: 'テスト',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestion,
      });

      const result = await fetchQuestionById('1');

      expect(result).toEqual(mockQuestion);
    });

    it('存在しない問題はnullを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchQuestionById('not-exist');

      expect(result).toBeNull();
    });
  });

  describe('fetchRandomQuestion', () => {
    it('ランダムな問題を取得できる', async () => {
      const mockQuestion: Question = {
        id: '1',
        categoryId: 'cat1',
        content: 'ランダム問題',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '解説',
        difficulty: 3,
        source: 'テスト',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestion,
      });

      const result = await fetchRandomQuestion();

      expect(result).toEqual(mockQuestion);
    });
  });

  describe('fetchSmartQuestion', () => {
    it('苦手分野優先の問題を取得できる', async () => {
      const mockQuestion: Question = {
        id: '1',
        categoryId: 'weak-cat',
        content: '苦手分野の問題',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: '解説',
        difficulty: 3,
        source: 'テスト',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestion,
      });

      const result = await fetchSmartQuestion('user123');

      expect(result).toEqual(mockQuestion);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/questions/smart?user_id=user123'),
        expect.any(Object)
      );
    });

    it('問題がない場合はnullを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchSmartQuestion('user123');

      expect(result).toBeNull();
    });
  });

  describe('submitAnswer', () => {
    it('回答を送信できる', async () => {
      const mockAnswer: Answer = {
        id: '1',
        questionId: 'q1',
        userId: 'user1',
        selectedAnswer: 0,
        isCorrect: true,
        answeredAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnswer,
      });

      const result = await submitAnswer({
        questionId: 'q1',
        userId: 'user1',
        selectedAnswer: 0,
      });

      expect(result).toEqual(mockAnswer);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/answers'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('fetchCategories', () => {
    it('カテゴリ一覧を取得できる', async () => {
      const mockCategories = [
        { id: '1', name: '深層学習', parentId: null },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

      const result = await fetchCategories();

      expect(result).toEqual(mockCategories);
    });
  });
});
