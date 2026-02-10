'use client';

import { useState, useRef, useEffect } from 'react';
import type { Question, ChatMessage } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExplanationChatProps {
  question: Question;
}

/**
 * 解説チャットコンポーネント
 * 問題の解説について追加質問できるチャット欄
 */
export function ExplanationChat({ question }: ExplanationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // ユーザーメッセージを追加
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);

    // アシスタントの空メッセージを追加（ストリーミング用）
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/questions/${question.id}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // SSE形式をパース: "data: {text}\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            try {
              // バックエンドがJSON encodeしたテキストを復元
              const text = JSON.parse(raw);
              assistantContent += text;
            } catch {
              // JSON parseに失敗した場合はそのまま使用
              assistantContent += raw;
            }
            setMessages([
              ...newMessages,
              { role: 'assistant', content: assistantContent },
            ]);
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-700 mb-3">追加質問</h4>

      {/* メッセージ一覧 */}
      {messages.length > 0 && (
        <div className="max-h-96 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 入力欄 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="この問題について質問する..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !input.trim() || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          送信
        </button>
      </div>
    </div>
  );
}
