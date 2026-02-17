'use client';

import katex from 'katex';
import { IdentificationFlowchart } from './IdentificationFlowchart';

interface ReferenceCard {
  id: string;
  title: string;
  integral: string;
  latexIntegral: string;
  actors: string;
  meaning: string;
  mnemonic: string;
}

const CARDS: ReferenceCard[] = [
  {
    id: 'bias',
    title: 'Bias²',
    integral: '単積分 ∫dx',
    latexIntegral: '\\int dx',
    actors: 'E_D[y] vs h(x)',
    meaning: '狙いのズレ（系統的誤差）',
    mnemonic: '「平均予測」と「真の関数」の差の二乗',
  },
  {
    id: 'variance',
    title: 'Variance',
    integral: '単積分 ∫dx（外側にE_D）',
    latexIntegral: '\\int dx \\;(\\text{外側に}E_D)',
    actors: 'y(x;D) vs E_D[y]',
    meaning: '予測のバラつき（不安定さ）',
    mnemonic: '「個別予測」と「平均予測」の差の二乗の期待値',
  },
  {
    id: 'noise',
    title: 'Noise',
    integral: '二重積分 ∬dxdt',
    latexIntegral: '\\iint dx\\,dt',
    actors: 'h(x) vs t',
    meaning: 'データ自体の揺れ（削減不可）',
    mnemonic: '「真の関数」と「観測値」の差の二乗',
  },
];

/** セクション3: クイックリファレンス（3カード + フローチャート） */
export function QuickReferenceSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
        クイックリファレンス
      </h3>

      {/* 3枚のカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CARDS.map((card) => (
          <div
            key={card.id}
            data-testid="reference-card"
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2"
          >
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {card.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="font-medium">積分:</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(card.latexIntegral, {
                      throwOnError: false,
                      displayMode: false,
                    }),
                  }}
                />
              </div>
              <div>
                <span className="font-medium">登場人物:</span> {card.actors}
              </div>
              <div>
                <span className="font-medium">意味:</span> {card.meaning}
              </div>
              <div>
                <span className="font-medium">覚え方:</span> {card.mnemonic}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 判別フローチャート */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          式を見分けよう
        </h4>
        <IdentificationFlowchart />
      </div>
    </section>
  );
}
