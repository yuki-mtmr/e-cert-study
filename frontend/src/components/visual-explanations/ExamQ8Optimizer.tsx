import { ExamCodeProblem } from './ExamCodeProblem';
import { examQ8Data } from '@/lib/visual-explanations/exam-q8-optimizer';

export function ExamQ8Optimizer() {
  return <ExamCodeProblem data={examQ8Data} />;
}
