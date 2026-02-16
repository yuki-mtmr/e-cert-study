import type { GlossarySection, GlossarySubsection } from '@/types/glossary';

export const SECTIONS: GlossarySection[] = [
  { id: 'math', name: '応用数学', emoji: '📐' },
  { id: 'ml', name: '機械学習', emoji: '🤖' },
  { id: 'dl-basic', name: '深層学習の基礎', emoji: '🧠' },
  { id: 'dl-app', name: '深層学習の応用', emoji: '🔬' },
  { id: 'devops', name: '開発・運用環境', emoji: '⚙️' },
];

export const SUBSECTIONS: GlossarySubsection[] = [
  // 応用数学
  { id: 'math-prob', name: '確率・統計', sectionId: 'math' },
  { id: 'math-info', name: '情報理論', sectionId: 'math' },
  { id: 'math-linalg', name: '線形代数', sectionId: 'math' },
  // 機械学習
  { id: 'ml-pattern', name: 'パターン認識', sectionId: 'ml' },
  { id: 'ml-class', name: '機械学習の分類', sectionId: 'ml' },
  { id: 'ml-issues', name: '機械学習の課題', sectionId: 'ml' },
  { id: 'ml-validation', name: '検証集合', sectionId: 'ml' },
  { id: 'ml-metrics', name: '性能指標', sectionId: 'ml' },
  // 深層学習の基礎
  { id: 'dl-ffnn', name: '順伝播型ニューラルネットワーク', sectionId: 'dl-basic' },
  { id: 'dl-activation', name: '活性化関数', sectionId: 'dl-basic' },
  { id: 'dl-loss', name: '損失関数', sectionId: 'dl-basic' },
  { id: 'dl-optim', name: '最適化', sectionId: 'dl-basic' },
  { id: 'dl-init', name: '重み初期化', sectionId: 'dl-basic' },
  { id: 'dl-reg', name: '正則化', sectionId: 'dl-basic' },
  { id: 'dl-cnn', name: '畳み込みニューラルネットワーク', sectionId: 'dl-basic' },
  { id: 'dl-rnn', name: '回帰型ニューラルネットワーク', sectionId: 'dl-basic' },
  { id: 'dl-transformer', name: 'Transformer', sectionId: 'dl-basic' },
  { id: 'dl-generalization', name: '汎化性能', sectionId: 'dl-basic' },
  // 深層学習の応用
  { id: 'app-image', name: '画像認識', sectionId: 'dl-app' },
  { id: 'app-detect', name: '物体検出', sectionId: 'dl-app' },
  { id: 'app-seg', name: 'セグメンテーション', sectionId: 'dl-app' },
  { id: 'app-nlp', name: '自然言語処理', sectionId: 'dl-app' },
  { id: 'app-gen', name: '生成モデル', sectionId: 'dl-app' },
  { id: 'app-rl', name: '深層強化学習', sectionId: 'dl-app' },
  { id: 'app-methods', name: '様々な学習方法', sectionId: 'dl-app' },
  { id: 'app-xai', name: '説明性(XAI)', sectionId: 'dl-app' },
  // 開発・運用環境
  { id: 'dev-framework', name: 'フレームワーク', sectionId: 'devops' },
  { id: 'dev-light', name: '軽量化・高速化', sectionId: 'devops' },
  { id: 'dev-accel', name: 'アクセラレータ', sectionId: 'devops' },
  { id: 'dev-env', name: '環境構築', sectionId: 'devops' },
];
