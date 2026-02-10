/**
 * ExplanationChatコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ExplanationChat } from '../ExplanationChat';
import type { Question } from '@/types';

const mockQuestion: Question = {
  id: '12345678-1234-1234-1234-123456789abc',
  categoryId: 'cat1',
  content: '活性化関数の役割は？',
  choices: ['正規化', '非線形性の導入', '損失計算', '勾配計算'],
  correctAnswer: 1,
  explanation: '活性化関数は非線形性を導入します。',
  difficulty: 3,
  source: 'テスト問題集',
  contentType: 'plain',
  images: [],
};

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('ExplanationChat', () => {
  it('チャット入力欄が表示される', () => {
    render(<ExplanationChat question={mockQuestion} />);

    expect(screen.getByPlaceholderText(/質問/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /送信/ })).toBeInTheDocument();
  });

  it('空のメッセージでは送信ボタンが無効', () => {
    render(<ExplanationChat question={mockQuestion} />);

    const sendButton = screen.getByRole('button', { name: /送信/ });
    expect(sendButton).toBeDisabled();
  });

  it('テキスト入力で送信ボタンが有効になる', () => {
    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: 'テスト質問' } });

    const sendButton = screen.getByRole('button', { name: /送信/ });
    expect(sendButton).not.toBeDisabled();
  });

  it('メッセージ送信でAPIが呼ばれる', async () => {
    // ReadableStreamのモック（JSON encoded SSE）
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: "テスト回答"\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: '詳しく教えて' } });

    const sendButton = screen.getByRole('button', { name: /送信/ });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/questions/${mockQuestion.id}/chat`),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      }),
    );
  });

  it('送信中はボタンが無効化される', async () => {
    // 解決しないPromiseでストリーミング中を再現
    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    const stream = new ReadableStream({
      async start(controller) {
        await streamPromise;
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: '質問です' } });

    const sendButton = screen.getByRole('button', { name: /送信/ });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    // 送信中はボタンが無効
    expect(screen.getByRole('button', { name: /送信/ })).toBeDisabled();

    // ストリームを完了
    await act(async () => {
      resolveStream!();
    });
  });

  it('IME変換確定時のEnterでは送信されない', () => {
    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: 'テスト' } });

    // isComposing: true のkeydownイベント（IME変換中）
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    // KeyboardEventInit の isComposing はReadOnlyなので、直接設定
    Object.defineProperty(keyDownEvent, 'isComposing', { value: true });
    input.dispatchEvent(keyDownEvent);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('複数行テキストがJSON decodeで正しく表示される', async () => {
    const multilineText = "# タイトル\n\n段落の説明です。";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(multilineText)}\n\n`));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: '説明して' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /送信/ }));
    });

    // MarkdownRendererに渡されるコンテンツに改行が含まれている
    await waitFor(() => {
      // タイトルと段落が表示される（MarkdownRendererがHTMLに変換）
      expect(screen.getByText('タイトル')).toBeInTheDocument();
      expect(screen.getByText('段落の説明です。')).toBeInTheDocument();
    });
  });

  it('ユーザーメッセージが表示される', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: "回答"\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });

    render(<ExplanationChat question={mockQuestion} />);

    const input = screen.getByPlaceholderText(/質問/);
    fireEvent.change(input, { target: { value: 'ユーザーの質問' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /送信/ }));
    });

    await waitFor(() => {
      expect(screen.getByText('ユーザーの質問')).toBeInTheDocument();
    });
  });
});
