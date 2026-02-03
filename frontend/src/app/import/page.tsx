'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ExtractedQuestion {
  content: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('PDFファイルを選択してください');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setExtractedQuestions([]);
      setImportSuccess(false);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // save_to_db=trueで抽出と同時にDBに保存（画像紐付けも実行）

      const response = await fetch(`${API_BASE_URL}/api/questions/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('問題の抽出に失敗しました');
      }

      const data = await response.json();
      setExtractedQuestions(data.questions || []);
      setSavedCount(data.saved_count || 0);

      if (data.questions?.length === 0) {
        setError('問題を抽出できませんでした。別のPDFを試してください。');
      } else if (data.saved_count > 0) {
        // 抽出と同時に保存完了
        setImportSuccess(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '問題の抽出に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (extractedQuestions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // 問題を一括登録
      for (const question of extractedQuestions) {
        await fetch(`${API_BASE_URL}/api/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: null, // デフォルトカテゴリ
            content: question.content,
            choices: question.choices,
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            source: file?.name || 'PDF Import',
          }),
        });
      }

      setImportSuccess(true);
      setExtractedQuestions([]);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e) {
      setError('問題の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedQuestions([]);
    setError(null);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold text-gray-900">問題インポート</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 成功メッセージ */}
        {importSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              {savedCount}問のインポートが完了しました！（抽出: {extractedQuestions.length}問）
            </p>
            <div className="mt-4 space-x-4">
              <Link
                href="/practice"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                問題を解く
              </Link>
              <button
                onClick={handleReset}
                className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                続けてインポート
              </button>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* ファイル選択 */}
        {!importSuccess && extractedQuestions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              PDFファイルを選択
            </h2>
            <p className="text-gray-600 mb-4">
              E資格の参考書や問題集のPDFをアップロードすると、
              AIが自動で問題を抽出します。
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer block"
              >
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-600 mb-2">
                  クリックしてPDFを選択
                </p>
                <p className="text-sm text-gray-400">
                  または、ファイルをドラッグ&ドロップ
                </p>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📄</span>
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExtract}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '抽出中...' : '問題を抽出'}
                </button>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">注意事項</h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>著作権に注意してください。個人利用目的のみでご使用ください。</li>
                <li>PDFのテキストが選択可能である必要があります。</li>
                <li>大きなファイルは処理に時間がかかる場合があります。</li>
              </ul>
            </div>
          </div>
        )}

        {/* 抽出結果プレビュー */}
        {extractedQuestions.length > 0 && importSuccess && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                登録された問題（{savedCount}問）
              </h2>
              <div className="space-x-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  続けてインポート
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {extractedQuestions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-800">
                      問題 {index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      難易度: {'★'.repeat(question.difficulty)}{'☆'.repeat(5 - question.difficulty)}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{question.content}</p>
                  <div className="space-y-1 text-sm">
                    {question.choices.map((choice, i) => (
                      <p
                        key={i}
                        className={`${
                          i === question.correctAnswer
                            ? 'text-green-700 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {choice}
                        {i === question.correctAnswer && ' ✓'}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {extractedQuestions.length > 0
                  ? '問題を登録中...'
                  : 'AIが問題を抽出中...'}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
