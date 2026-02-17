export type MetricCategory = 'base' | 'rate' | 'composite' | 'curve';

export interface MetricNode {
  id: string;
  label: string;
  enLabel: string;
  category: MetricCategory;
  x: number;
  y: number;
  formula: string;
  latexFormula?: string;
  description: string;
}

export interface MetricEdge {
  from: string;
  to: string;
  label: string;
}

const CATEGORY_COLORS: Record<MetricCategory, string> = {
  base: '#6366F1',
  rate: '#3B82F6',
  composite: '#10B981',
  curve: '#F59E0B',
};

export function getCategoryColor(category: MetricCategory): string {
  return CATEGORY_COLORS[category];
}

/** 評価指標ノードデータ */
export function getMetricNodes(): MetricNode[] {
  return [
    // base: 混同行列の4要素
    { id: 'tp', label: 'TP', enLabel: 'True Positive', category: 'base', x: 0.15, y: 0.1, formula: '', description: '実際が陽性で、陽性と予測した数' },
    { id: 'fp', label: 'FP', enLabel: 'False Positive', category: 'base', x: 0.35, y: 0.1, formula: '', description: '実際が陰性で、陽性と予測した数' },
    { id: 'fn', label: 'FN', enLabel: 'False Negative', category: 'base', x: 0.55, y: 0.1, formula: '', description: '実際が陽性で、陰性と予測した数' },
    { id: 'tn', label: 'TN', enLabel: 'True Negative', category: 'base', x: 0.75, y: 0.1, formula: '', description: '実際が陰性で、陰性と予測した数' },

    // rate: 基本指標
    { id: 'precision', label: '適合率', enLabel: 'Precision', category: 'rate', x: 0.15, y: 0.35, formula: 'TP / (TP + FP)', latexFormula: '\\frac{TP}{TP + FP}', description: '陽性と予測したもののうち、実際に陽性だった割合' },
    { id: 'recall', label: '再現率', enLabel: 'Recall / TPR', category: 'rate', x: 0.4, y: 0.35, formula: 'TP / (TP + FN)', latexFormula: '\\frac{TP}{TP + FN}', description: '実際の陽性のうち、正しく陽性と予測できた割合' },
    { id: 'fpr', label: '偽陽性率', enLabel: 'FPR', category: 'rate', x: 0.65, y: 0.35, formula: 'FP / (FP + TN)', latexFormula: '\\frac{FP}{FP + TN}', description: '実際の陰性のうち、誤って陽性と予測した割合' },
    { id: 'specificity', label: '特異度', enLabel: 'Specificity', category: 'rate', x: 0.85, y: 0.35, formula: 'TN / (TN + FP)', latexFormula: '\\frac{TN}{TN + FP}', description: '実際の陰性のうち、正しく陰性と予測できた割合' },
    { id: 'accuracy', label: '正解率', enLabel: 'Accuracy', category: 'rate', x: 0.9, y: 0.1, formula: '(TP + TN) / (TP + FP + FN + TN)', latexFormula: '\\frac{TP + TN}{TP + FP + FN + TN}', description: '全サンプル中の正解割合' },

    // composite: 複合指標
    { id: 'f1', label: 'F1スコア', enLabel: 'F1 Score', category: 'composite', x: 0.25, y: 0.6, formula: '2 × Precision × Recall / (Precision + Recall)', latexFormula: '\\frac{2 \\cdot P \\cdot R}{P + R}', description: '適合率と再現率の調和平均' },
    { id: 'macro', label: 'マクロ平均', enLabel: 'Macro Average', category: 'composite', x: 0.5, y: 0.6, formula: '(1/K) Σ metric_k', latexFormula: '\\frac{1}{K}\\sum_{k} \\text{metric}_k', description: '各クラスの指標を単純平均' },
    { id: 'micro', label: 'マイクロ平均', enLabel: 'Micro Average', category: 'composite', x: 0.75, y: 0.6, formula: 'Σ TP / (Σ TP + Σ FP)', latexFormula: '\\frac{\\sum TP}{\\sum TP + \\sum FP}', description: '全クラスのTP/FP/FNを合算して計算' },

    // curve: 曲線ベース指標
    { id: 'roc', label: 'ROC曲線', enLabel: 'ROC Curve', category: 'curve', x: 0.2, y: 0.85, formula: 'TPR vs FPR', latexFormula: '\\text{TPR vs FPR}', description: '閾値を変化させたときのTPR対FPRのプロット' },
    { id: 'auc', label: 'AUC', enLabel: 'Area Under ROC', category: 'curve', x: 0.4, y: 0.85, formula: '∫ ROC curve', latexFormula: '\\int \\text{ROC curve}', description: 'ROC曲線の下の面積' },
    { id: 'pr', label: 'PR曲線', enLabel: 'PR Curve', category: 'curve', x: 0.6, y: 0.85, formula: 'Precision vs Recall', latexFormula: '\\text{Precision vs Recall}', description: '閾値を変化させたときのPrecision対Recallのプロット' },
    { id: 'ap', label: 'AP', enLabel: 'Average Precision', category: 'curve', x: 0.75, y: 0.85, formula: '∫ PR curve', latexFormula: '\\int \\text{PR curve}', description: 'PR曲線の下の面積' },
    { id: 'map', label: 'mAP', enLabel: 'mean AP', category: 'curve', x: 0.9, y: 0.85, formula: '(1/K) Σ AP_k', latexFormula: '\\frac{1}{K}\\sum_{k} AP_k', description: '全クラスのAPの平均' },
  ];
}

/** 指標間の関係エッジ */
export function getMetricEdges(): MetricEdge[] {
  return [
    // base → rate
    { from: 'tp', to: 'precision', label: 'TP使用' },
    { from: 'fp', to: 'precision', label: 'FP使用' },
    { from: 'tp', to: 'recall', label: 'TP使用' },
    { from: 'fn', to: 'recall', label: 'FN使用' },
    { from: 'fp', to: 'fpr', label: 'FP使用' },
    { from: 'tn', to: 'fpr', label: 'TN使用' },
    { from: 'tn', to: 'specificity', label: 'TN使用' },
    { from: 'fp', to: 'specificity', label: 'FP使用' },

    // rate → composite
    { from: 'precision', to: 'f1', label: '調和平均' },
    { from: 'recall', to: 'f1', label: '調和平均' },

    // rate → curve
    { from: 'recall', to: 'roc', label: 'TPR軸' },
    { from: 'fpr', to: 'roc', label: 'FPR軸' },
    { from: 'precision', to: 'pr', label: 'Precision軸' },
    { from: 'recall', to: 'pr', label: 'Recall軸' },

    // curve → curve
    { from: 'roc', to: 'auc', label: '面積計算' },
    { from: 'pr', to: 'ap', label: '面積計算' },
    { from: 'ap', to: 'map', label: '平均' },

    // multi-class
    { from: 'precision', to: 'macro', label: 'クラス平均' },
    { from: 'recall', to: 'macro', label: 'クラス平均' },
    { from: 'tp', to: 'micro', label: '合算' },
    { from: 'fp', to: 'micro', label: '合算' },
    { from: 'fn', to: 'micro', label: '合算' },
  ];
}
