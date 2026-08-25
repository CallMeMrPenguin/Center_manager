export interface ExerciseItem {
  id: number;
  qNum: string | number;
  type?: string;
  sectionTitle?: string;
  instruction?: string;
  wordBank?: string[];
  passage?: string;
  text: string;
  options?: string[];
  answer: string;
  explanation?: string;
}
