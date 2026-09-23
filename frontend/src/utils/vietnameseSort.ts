import { Row } from '@tanstack/react-table';

/**
 * Vietnamese Name Sorting Utility
 *
 * Algorithm (Right-to-Left Word Comparison):
 * 1. Compare the last word (tên chính / given name) first.
 * 2. Compare letters using standard Vietnamese alphabetical collation ('vi').
 * 3. If the last word is identical, move to the word immediately preceding it (tên đệm) and repeat backwards.
 * 4. If all backwards words matched, the name with fewer words (shorter) comes first.
 *    Example: "Nguyễn Thùy Dương" comes before "Nguyễn Thị Thùy Dương".
 */

/**
 * Normalizes a name string: trims spaces, removes extra inner spaces,
 * and strips trailing nickname annotations like "(Bắp)" or "- Bắp".
 */
export function normalizeVietnameseName(name: any): string {
  if (name === null || name === undefined) return '';
  const str = String(name).trim();
  if (!str) return '';
  // Strip trailing parenthesized nickname e.g. "Nguyễn Văn A (Bé)" -> "Nguyễn Văn A"
  const stripped = str.replace(/\s*\([^)]*\)$/, '').trim();
  return stripped.replace(/\s+/g, ' ');
}

/**
 * Compares two single Vietnamese words letter by letter using Vietnamese collation.
 */
export function compareVietnameseWords(wordA: string, wordB: string): number {
  const lowerA = wordA.toLowerCase();
  const lowerB = wordB.toLowerCase();
  const cmp = lowerA.localeCompare(lowerB, 'vi');
  if (cmp !== 0) return cmp;
  return wordA.localeCompare(wordB, 'vi');
}

/**
 * Compares two full Vietnamese names according to the Right-to-Left rule.
 */
export function compareVietnameseNames(nameA: any, nameB: any): number {
  const normA = normalizeVietnameseName(nameA);
  const normB = normalizeVietnameseName(nameB);

  if (!normA && !normB) return 0;
  if (!normA) return 1;
  if (!normB) return -1;

  const wordsA = normA.split(' ').filter(Boolean);
  const wordsB = normB.split(' ').filter(Boolean);

  let i = wordsA.length - 1;
  let j = wordsB.length - 1;

  // Compare words starting from the last word (tên chính) backwards to the first word (họ)
  while (i >= 0 && j >= 0) {
    const cmp = compareVietnameseWords(wordsA[i], wordsB[j]);
    if (cmp !== 0) return cmp;
    i--;
    j--;
  }

  // If one name ran out of words while all backwards words matched,
  // the shorter name (fewer words) comes first.
  return (i + 1) - (j + 1);
}

/**
 * Extracts a name string from a TanStack Table row for a given columnId.
 */
export function extractNameFromRow(row: Row<any>, columnId: string): string {
  const val = row.getValue(columnId);
  if (typeof val === 'string' && val.trim()) return val;

  const orig = row.original;
  if (orig && typeof orig === 'object') {
    if (typeof orig.full_name === 'string' && orig.full_name.trim()) return orig.full_name;
    if (typeof orig.student_name === 'string' && orig.student_name.trim()) return orig.student_name;
    if (typeof orig.display_name === 'string' && orig.display_name.trim()) return orig.display_name;
    if (typeof orig.teacher_name === 'string' && orig.teacher_name.trim()) return orig.teacher_name;
    if (typeof orig.name === 'string' && orig.name.trim()) return orig.name;
  }

  return val != null ? String(val) : '';
}

/**
 * TanStack Table custom sorting function for Vietnamese person names.
 */
export const vietnameseNameSortingFn = (rowA: Row<any>, rowB: Row<any>, columnId: string): number => {
  const nameA = extractNameFromRow(rowA, columnId);
  const nameB = extractNameFromRow(rowB, columnId);
  return compareVietnameseNames(nameA, nameB);
};

/**
 * Detects whether a TanStack column definition represents a Vietnamese person name.
 */
export function isNameColumn(column: any): boolean {
  if (!column) return false;

  // Explicit metadata flag overrides
  if (column.meta?.isName === true) return true;
  if (column.meta?.isName === false) return false;

  const id = String(column.id || '').toLowerCase();
  const accessor = String(column.accessorKey || '').toLowerCase();

  // Exclude non-person names (classes, courses, tests, files, units)
  const excludeKeywords = ['class', 'lop', 'course', 'mon', 'test', 'exam', 'unit', 'file', 'type', 'room', 'phong', 'status'];
  if (excludeKeywords.some(kw => id.includes(kw) || accessor.includes(kw))) {
    return false;
  }

  // Exact or common person name fields
  const nameKeys = ['full_name', 'student_name', 'teacher_name', 'display_name', 'user_name'];
  if (nameKeys.includes(accessor) || nameKeys.includes(id)) return true;

  if (id === 'name' || accessor === 'name') return true;

  // Check header text
  let headerText = '';
  if (typeof column.header === 'string') {
    headerText = column.header.toLowerCase();
  } else if (column.meta?.headerText) {
    headerText = String(column.meta.headerText).toLowerCase();
  }

  if (
    headerText.includes('họ và tên') ||
    headerText.includes('họ tên') ||
    headerText.includes('tên học sinh') ||
    headerText.includes('tên giáo viên') ||
    headerText.includes('tên hiển thị') ||
    headerText === 'học sinh' ||
    headerText === 'giáo viên'
  ) {
    return true;
  }

  return false;
}
