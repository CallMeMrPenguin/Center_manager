export interface UlnTableNode {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface UlnBoxNode {
  type: 'box';
  isFormula?: boolean;
  content?: string;
  words?: string[];
}

export interface UlnQuoteNode {
  type: 'quote';
  title?: string;
  paragraphs: string[];
  notes?: string[];
}

export interface UlnMultiColNode {
  type: 'tab_cols';
  cols: number; // 2, 3, or 4
  items: string[][];
}

export interface UlnPicGridNode {
  type: 'pic_grid';
  rows: string[][];
}

export interface UlnDialogueOrderNode {
  type: 'dialogue_order';
  items: { initialNum?: string; text: string }[];
}

export interface UlnQuestionNode {
  type: 'question';
  qNum?: string;
  text: string;
  subText?: string;
  subParagraphs?: string[];
  hasWritingLine?: boolean;
  options?: string[];
  bracketHint?: string;
  picRight?: string;
}

export interface UlnHeadingNode {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'ins' | 'paragraph';
  text: string;
  answerCount?: number;
  answerKey?: string[];
}

export type UlnNode =
  | UlnTableNode
  | UlnBoxNode
  | UlnQuoteNode
  | UlnMultiColNode
  | UlnPicGridNode
  | UlnDialogueOrderNode
  | UlnQuestionNode
  | UlnHeadingNode;
