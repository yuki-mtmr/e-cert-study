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
  snakeToCamelCase,
  transformKeys,
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

describe('snakeToCamelCase', () => {
  it('snake_caseをcamelCaseに変換できる', () => {
    expect(snakeToCamelCase('correct_answer')).toBe('correctAnswer');
    expect(snakeToCamelCase('category_id')).toBe('categoryId');
    expect(snakeToCamelCase('content_type')).toBe('contentType');
    expect(snakeToCamelCase('question_id')).toBe('questionId');
    expect(snakeToCamelCase('file_path')).toBe('filePath');
    expect(snakeToCamelCase('alt_text')).toBe('altText');
    expect(snakeToCamelCase('image_type')).toBe('imageType');
    expect(snakeToCamelCase('user_id')).toBe('userId');
    expect(snakeToCamelCase('selected_answer')).toBe('selectedAnswer');
    expect(snakeToCamelCase('is_correct')).toBe('isCorrect');
    expect(snakeToCamelCase('answered_at')).toBe('answeredAt');
    expect(snakeToCamelCase('parent_id')).toBe('parentId');
  });

  it('アンダースコアのない文字列はそのまま返す', () => {
    expect(snakeToCamelCase('id')).toBe('id');
    expect(snakeToCamelCase('name')).toBe('name');
    expect(snakeToCamelCase('content')).toBe('content');
  });

  it('複数のアンダースコアを処理できる', () => {
    expect(snakeToCamelCase('some_long_variable_name')).toBe('someLongVariableName');
  });
});

describe('transformKeys', () => {
  it('オブジェクトのキーをsnake_caseからcamelCaseに変換できる', () => {
    const input = {
      correct_answer: 2,
      category_id: 'cat1',
      content_type: 'plain',
    };
    const expected = {
      correctAnswer: 2,
      categoryId: 'cat1',
      contentType: 'plain',
    };
    expect(transformKeys(input)).toEqual(expected);
  });

  it('ネストしたオブジェクトも変換できる', () => {
    const input = {
      question_id: 'q1',
      images: [
        { file_path: '/path/to/image', alt_text: 'テスト画像', image_type: 'question' },
      ],
    };
    const expected = {
      questionId: 'q1',
      images: [
        { filePath: '/path/to/image', altText: 'テスト画像', imageType: 'question' },
      ],
    };
    expect(transformKeys(input)).toEqual(expected);
  });

  it('配列を処理できる', () => {
    const input = [
      { correct_answer: 1, category_id: 'cat1' },
      { correct_answer: 2, category_id: 'cat2' },
    ];
    const expected = [
      { correctAnswer: 1, categoryId: 'cat1' },
      { correctAnswer: 2, categoryId: 'cat2' },
    ];
    expect(transformKeys(input)).toEqual(expected);
  });

  it('nullやundefinedはそのまま返す', () => {
    expect(transformKeys(null)).toBeNull();
    expect(transformKeys(undefined)).toBeUndefined();
  });

  it('プリミティブ値はそのまま返す', () => {
    expect(transformKeys('string')).toBe('string');
    expect(transformKeys(123)).toBe(123);
    expect(transformKeys(true)).toBe(true);
  });
});

describe('API Response Transformation', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetchQuestionsでsnake_caseレスポンスをcamelCaseに変換する', async () => {
    // バックエンドのsnake_caseレスポンス
    const snakeCaseResponse = [
      {
        id: '1',
        category_id: 'cat1',
        content: 'テスト問題',
        choices: ['A', 'B', 'C', 'D'],
        correct_answer: 2,
        explanation: '解説',
        difficulty: 3,
        source: 'テスト',
        content_type: 'plain',
        images: [],
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => snakeCaseResponse,
    });

    const result = await fetchQuestions();

    // camelCaseに変換されていることを確認
    expect(result[0].correctAnswer).toBe(2);
    expect(result[0].categoryId).toBe('cat1');
    expect(result[0].contentType).toBe('plain');
  });

  it('fetchRandomQuestionでsnake_caseレスポンスをcamelCaseに変換する', async () => {
    const snakeCaseResponse = {
      id: '1',
      category_id: 'cat1',
      content: 'ランダム問題',
      choices: ['A', 'B', 'C', 'D'],
      correct_answer: 1,
      explanation: '解説',
      difficulty: 3,
      source: 'テスト',
      content_type: 'markdown',
      images: [
        {
          id: 'img1',
          question_id: '1',
          file_path: '/images/test.png',
          alt_text: 'テスト画像',
          position: 0,
          image_type: 'question',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => snakeCaseResponse,
    });

    const result = await fetchRandomQuestion();

    expect(result?.correctAnswer).toBe(1);
    expect(result?.categoryId).toBe('cat1');
    expect(result?.contentType).toBe('markdown');
    expect(result?.images[0].questionId).toBe('1');
    expect(result?.images[0].filePath).toBe('/images/test.png');
    expect(result?.images[0].altText).toBe('テスト画像');
    expect(result?.images[0].imageType).toBe('question');
  });

  it('submitAnswerでsnake_caseレスポンスをcamelCaseに変換する', async () => {
    const snakeCaseResponse = {
      id: '1',
      question_id: 'q1',
      user_id: 'user1',
      selected_answer: 0,
      is_correct: true,
      answered_at: '2024-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => snakeCaseResponse,
    });

    const result = await submitAnswer({
      questionId: 'q1',
      userId: 'user1',
      selectedAnswer: 0,
    });

    expect(result.questionId).toBe('q1');
    expect(result.userId).toBe('user1');
    expect(result.selectedAnswer).toBe(0);
    expect(result.isCorrect).toBe(true);
    expect(result.answeredAt).toBe('2024-01-01T00:00:00Z');
  });

  it('fetchCategoriesでsnake_caseレスポンスをcamelCaseに変換する', async () => {
    const snakeCaseResponse = [
      { id: '1', name: '深層学習', parent_id: null },
      { id: '2', name: 'CNN', parent_id: '1' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => snakeCaseResponse,
    });

    const result = await fetchCategories();

    expect(result[0].parentId).toBeNull();
    expect(result[1].parentId).toBe('1');
  });
});
