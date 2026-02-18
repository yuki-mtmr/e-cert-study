import { ExamCodeProblem } from './ExamCodeProblem';
import { examQ4Data } from '@/lib/visual-explanations/exam-q4-softmax-loss';

export function ExamQ4SoftmaxLoss() {
  return <ExamCodeProblem data={examQ4Data} />;
}
