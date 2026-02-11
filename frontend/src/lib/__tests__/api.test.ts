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
  fetchStudyPlan,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  fetchStudyPlanSummary,
  fetchCategoryCoverage,
  fetchMockExamHistory,
  type CategoryCoverage,
} from '../api';
import type { Question, Answer, StudyPlan, StudyPlanSummary } from '@/types';

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

    it('単一カテゴリでフィルタリングできる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1' }),
      });

      await fetchRandomQuestion('cat1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category_id=cat1'),
        expect.any(Object)
      );
    });

    it('複数カテゴリでフィルタリングできる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1' }),
      });

      await fetchRandomQuestion(['cat1', 'cat2', 'cat3']);

      // 複数カテゴリはcategory_idsパラメータで送信される
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category_ids=cat1%2Ccat2%2Ccat3'),
        expect.any(Object)
      );
    });

    it('空の配列を渡すとフィルタなしで取得', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1' }),
      });

      await fetchRandomQuestion([]);

      // 空配列の場合はパラメータなし
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('category'),
        expect.any(Object)
      );
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

    it('タイムアウト時にエラーをスローする', async () => {
      // fetchがAbortControllerのsignalを受け取ることを確認
      mockFetch.mockImplementationOnce((url, options) => {
        // signalが渡されていることを確認
        expect(options.signal).toBeDefined();
        expect(options.signal).toBeInstanceOf(AbortSignal);

        // タイムアウトをシミュレート: abortされたらエラーをスロー
        return new Promise((_, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          });
        });
      });

      // 5秒より少し長く待ってタイムアウトをトリガー
      await expect(
        submitAnswer({
          questionId: 'q1',
          userId: 'user1',
          selectedAnswer: 0,
        })
      ).rejects.toThrow();
    }, 10000);

    it('fetchにAbortSignalが渡される', async () => {
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

      await submitAnswer({
        questionId: 'q1',
        userId: 'user1',
        selectedAnswer: 0,
      });

      // fetchにsignalオプションが渡されていることを確認
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
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

describe('Study Plan API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchStudyPlan', () => {
    it('学習プランを取得できる', async () => {
      const mockStudyPlan: StudyPlan = {
        id: '1',
        userId: 'user123',
        examDate: '2026-03-15',
        targetQuestionsPerDay: 20,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStudyPlan,
      });

      const result = await fetchStudyPlan('user123');

      expect(result).toEqual(mockStudyPlan);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/study-plan?user_id=user123'),
        expect.any(Object)
      );
    });

    it('存在しない学習プランはnullを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchStudyPlan('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createStudyPlan', () => {
    it('学習プランを作成できる', async () => {
      const mockStudyPlan: StudyPlan = {
        id: '1',
        userId: 'user123',
        examDate: '2026-03-15',
        targetQuestionsPerDay: 25,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStudyPlan,
      });

      const result = await createStudyPlan({
        userId: 'user123',
        examDate: '2026-03-15',
        targetQuestionsPerDay: 25,
      });

      expect(result).toEqual(mockStudyPlan);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/study-plan'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('updateStudyPlan', () => {
    it('学習プランを更新できる', async () => {
      const mockStudyPlan: StudyPlan = {
        id: '1',
        userId: 'user123',
        examDate: '2026-04-01',
        targetQuestionsPerDay: 30,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStudyPlan,
      });

      const result = await updateStudyPlan('user123', {
        examDate: '2026-04-01',
        targetQuestionsPerDay: 30,
      });

      expect(result).toEqual(mockStudyPlan);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/study-plan?user_id=user123'),
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('deleteStudyPlan', () => {
    it('学習プランを削除できる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Study plan deleted successfully' }),
      });

      await deleteStudyPlan('user123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/study-plan?user_id=user123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('fetchStudyPlanSummary', () => {
    it('学習プランサマリーを取得できる', async () => {
      const mockSummary: StudyPlanSummary = {
        daysRemaining: 40,
        totalAnswered: 100,
        totalCorrect: 80,
        accuracy: 80.0,
        streak: 5,
        dailyProgress: [
          {
            date: '2026-02-01',
            targetCount: 20,
            actualCount: 22,
            correctCount: 18,
          },
          {
            date: '2026-02-02',
            targetCount: 20,
            actualCount: 20,
            correctCount: 16,
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await fetchStudyPlanSummary('user123');

      expect(result).toEqual(mockSummary);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/study-plan/summary?user_id=user123'),
        expect.any(Object)
      );
    });

    it('学習プランがない場合はnullを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchStudyPlanSummary('nonexistent');

      expect(result).toBeNull();
    });
  });
});

describe('fetchMockExamHistory', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetchにAbortSignalが渡される（タイムアウト防止）', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ exams: [], total_count: 0 }),
    });

    await fetchMockExamHistory('test-user');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('タイムアウト時にエラーをスローする', async () => {
    vi.useFakeTimers();

    mockFetch.mockImplementationOnce((_url: string, options: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => {
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const promise = fetchMockExamHistory('test-user');

    // 30秒のタイムアウトを即座にトリガー
    vi.advanceTimersByTime(30000);

    await expect(promise).rejects.toThrow();

    vi.useRealTimers();
  });
});

describe('Category Coverage API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('fetchCategoryCoverage', () => {
    it('カテゴリ別網羅率を取得できる', async () => {
      const mockCoverage: CategoryCoverage[] = [
        {
          categoryId: '1',
          categoryName: '応用数学',
          totalQuestions: 50,
          answeredCount: 30,
          correctCount: 25,
          coverageRate: 60.0,
          accuracy: 83.3,
        },
        {
          categoryId: '2',
          categoryName: '機械学習',
          totalQuestions: 40,
          answeredCount: 20,
          correctCount: 15,
          coverageRate: 50.0,
          accuracy: 75.0,
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoverage,
      });

      const result = await fetchCategoryCoverage('user123');

      expect(result).toEqual(mockCoverage);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stats/category-coverage?user_id=user123'),
        expect.any(Object)
      );
    });

    it('空のリストを正しく返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await fetchCategoryCoverage('user123');

      expect(result).toEqual([]);
    });

    it('snake_caseレスポンスをcamelCaseに変換する', async () => {
      const snakeCaseResponse = [
        {
          category_id: '1',
          category_name: '応用数学',
          total_questions: 50,
          answered_count: 30,
          correct_count: 25,
          coverage_rate: 60.0,
          accuracy: 83.3,
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => snakeCaseResponse,
      });

      const result = await fetchCategoryCoverage('user123');

      expect(result[0].categoryId).toBe('1');
      expect(result[0].categoryName).toBe('応用数学');
      expect(result[0].totalQuestions).toBe(50);
      expect(result[0].answeredCount).toBe(30);
      expect(result[0].correctCount).toBe(25);
      expect(result[0].coverageRate).toBe(60.0);
      expect(result[0].accuracy).toBe(83.3);
    });
  });
});
