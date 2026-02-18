import { ExamCodeProblem } from './ExamCodeProblem';
import { examQ5Data } from '@/lib/visual-explanations/exam-q5-activation-backward';

export function ExamQ5ActivationBackward() {
  return <ExamCodeProblem data={examQ5Data} />;
}
