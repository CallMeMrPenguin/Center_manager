import { format1Dec } from '../../../utils';

/**
 * Normalizes text for lenient yet accurate matching:
 * - Trims whitespace and removes duplicate internal spaces
 * - Converts to lowercase
 * - Normalizes smart quotes and accents
 * - Strips trailing periods, exclamation marks, question marks
 */
export function normalizeAnswerText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[.?!,;]+$/g, '') // remove trailing punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a student's answer is correct against a pipe-separated answer key string.
 * Supports multiple valid variations (e.g. "variant 1 | variant 2") and prefix-tolerant matching.
 */
export function checkAnswerCorrect(
  userAns: string,
  keyString: string,
  prefixHint?: string
): boolean {
  if (!userAns || !keyString) return false;

  const cleanUser = normalizeAnswerText(userAns);
  if (!cleanUser) return false;

  // Split multiple acceptable keys by pipe '|'
  const validKeys = keyString
    .split('|')
    .map((k) => normalizeAnswerText(k))
    .filter(Boolean);

  if (validKeys.length === 0) return false;

  // 1. Direct match with any of the valid keys
  if (validKeys.includes(cleanUser)) return true;

  // 2. Letter-only multiple choice match (e.g. user answered "A" or "A. apple" and key is "A")
  for (const k of validKeys) {
    if (/^[a-d]$/i.test(k)) {
      // Key is single letter A/B/C/D
      if (cleanUser === k.toLowerCase()) return true;
      if (cleanUser.startsWith(`${k.toLowerCase()}.`) || cleanUser.startsWith(`${k.toLowerCase()} `)) return true;
    }
  }

  // 3. Prefix-tolerant matching for sentence rewriting
  if (prefixHint) {
    const cleanPrefix = normalizeAnswerText(prefixHint);
    if (cleanPrefix) {
      for (const k of validKeys) {
        // If key has the full sentence and user typed only the blank part
        if (k.startsWith(cleanPrefix)) {
          const remainder = normalizeAnswerText(k.slice(cleanPrefix.length));
          if (remainder && cleanUser === remainder) return true;
        }
        // If user typed the full sentence and key is only the blank part
        if (cleanUser.startsWith(cleanPrefix)) {
          const remainderUser = normalizeAnswerText(cleanUser.slice(cleanPrefix.length));
          if (remainderUser && remainderUser === k) return true;
        }
      }
    }
  }

  return false;
}

/**
 * Extracts a map of question number -> answer key string from ULN text content.
 */
export function extractAnswerKeysFromUln(ulnText: string): Record<string, string> {
  const keysMap: Record<string, string> = {};
  if (!ulnText) return keysMap;

  // Match [ANS] ... [/ANS] blocks
  const ansBlockRegex = /\[ANS\]([\s\S]*?)\[\/ANS\]/gi;
  let match: RegExpExecArray | null;

  while ((match = ansBlockRegex.exec(ulnText)) !== null) {
    const blockContent = match[1];
    const lines = blockContent.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Matches formats like: "1. A | B", "Q1: answer", "#1. answer"
      const itemMatch = trimmed.match(/^(?:#|Q|Câu)?\s*(\d+)[\.:\s]+(.+)$/i);
      if (itemMatch) {
        const qNum = itemMatch[1];
        const keyVal = itemMatch[2].trim();
        if (keyVal) {
          keysMap[qNum] = keyVal;
        }
      }
    });
  }

  // Also check inline \ans: tags or [P0] [ans] tags
  const inlineAnsRegex = /\\ans:\s*([^\n]+)/gi;
  let inlineMatch: RegExpExecArray | null;
  let autoIdx = 1;
  while ((inlineMatch = inlineAnsRegex.exec(ulnText)) !== null) {
    const val = inlineMatch[1].trim();
    if (val && !keysMap[String(autoIdx)]) {
      keysMap[String(autoIdx)] = val;
    }
    autoIdx++;
  }

  return keysMap;
}

/**
 * Injects or updates the [ANS] block in the ULN text.
 */
export function updateAnswerKeysInUln(
  ulnText: string,
  updatedKeys: Record<string, string>
): string {
  let text = ulnText || '';

  // Format new ANS block
  const lines: string[] = [];
  const sortedNums = Object.keys(updatedKeys).sort((a, b) => Number(a) - Number(b));
  sortedNums.forEach((qNum) => {
    lines.push(`${qNum}. ${updatedKeys[qNum]}`);
  });

  const newAnsBlock = `[H2] **ANSWER KEY**\n[ANS]\n${lines.join('\n')}\n[/ANS]`;

  // If [ANS] already exists, replace it
  if (/\[ANS\][\s\S]*?\[\/ANS\]/i.test(text)) {
    return text.replace(/\[H2\]\s*\*\*ANSWER KEY\*\*[\s\S]*?\[\/ANS\]/i, newAnsBlock)
      .replace(/\[ANS\][\s\S]*?\[\/ANS\]/i, newAnsBlock);
  }

  // Otherwise append at the bottom
  return `${text.trim()}\n\n${newAnsBlock}\n`;
}

/**
 * Calculates a student's score against a key map.
 */
export function gradeStudentSubmission(
  studentAnswers: Record<string, string>,
  answerKeys: Record<string, string>,
  maxScore = 10
): {
  score: number;
  correctCount: number;
  totalCount: number;
  details: Record<string, boolean>;
} {
  const totalCount = Math.max(Object.keys(answerKeys).length, 1);
  let correctCount = 0;
  const details: Record<string, boolean> = {};

  Object.entries(answerKeys).forEach(([qNum, keyStr]) => {
    // Find matching student answer by exact number or prefixed key
    const userVal =
      studentAnswers[qNum] ||
      studentAnswers[`q_${qNum}`] ||
      Object.entries(studentAnswers).find(([k]) => k.includes(`_${qNum}_`) || k.endsWith(`_${qNum}`))?.[1] ||
      '';

    const isCorrect = checkAnswerCorrect(userVal, keyStr);
    details[qNum] = isCorrect;
    if (isCorrect) correctCount++;
  });

  const rawScore = (correctCount / totalCount) * maxScore;
  const finalScore = Number(format1Dec(rawScore));

  return {
    score: finalScore,
    correctCount,
    totalCount,
    details,
  };
}
