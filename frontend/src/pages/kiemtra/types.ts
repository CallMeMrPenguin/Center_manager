export interface Question {
  id: number;
  type: 'mcq' | 'fill';
  question: string;
  instruction?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
}

export interface TestData {
  title: string;
  questions: Question[];
}

export type TimerMode = 'none' | 'global' | 'per_question';

export interface QuizSettings {
  timerMode: TimerMode;
  globalTimeSeconds: number;
  perQuestionSeconds: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  selectedClassId: number | '';
  selectedStudentId: number | '';
  scoreSlot: 'check_1' | 'check_2' | 'homework';
}
