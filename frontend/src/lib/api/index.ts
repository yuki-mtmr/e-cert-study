/**
 * APIクライアント — バレル re-export
 */
export { snakeToCamelCase, transformKeys } from './client';
export { fetchQuestions, fetchQuestionById, fetchRandomQuestion, fetchSmartQuestion } from './questions';
export { submitAnswer, fetchAnswerHistory } from './answers';
export { fetchCategories, fetchCategoriesTree } from './categories';
export {
  type OverviewStats,
  type CategoryStats,
  type DailyProgress,
  type CategoryCoverage,
  fetchOverviewStats,
  fetchWeakAreas,
  fetchDailyProgress,
  fetchCategoryCoverage,
} from './stats';
export {
  fetchStudyPlan,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  fetchStudyPlanSummary,
} from './study-plan';
export {
  startMockExam,
  submitMockExamAnswer,
  finishMockExam,
  fetchMockExamResult,
  fetchMockExamHistory,
  requestAIAnalysis,
} from './mock-exam';
export {
  fetchReviewItems,
  fetchMasteredItems,
  fetchReviewStats,
  fetchReviewItemsDetailed,
  triggerReviewBackfill,
} from './review';
