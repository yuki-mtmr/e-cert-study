export type ChoiceLabel = 'A' | 'B' | 'C' | 'D';

export interface ExamChoice {
  label: ChoiceLabel;
  code: string;
}

export interface ExamSubQuestion {
  id: string;
  blankLabel: string;
  number: number;
  codeContext: string;
  choices: ExamChoice[];
  correctLabel: ChoiceLabel;
  explanation: string;
}

export interface ExamCodeProblemData {
  id: string;
  title: string;
  classCode: string;
  subQuestions: ExamSubQuestion[];
}
