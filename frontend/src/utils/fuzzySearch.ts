/**
 * High-performance Fuzzy / Near-Match search engine for Vietnamese & English.
 * Supports:
 * 1. Accented & unaccented Vietnamese search (e.g. 'nguyen' matches 'Nguyễn')
 * 2. Typo tolerance & Levenshtein distance (e.g. 'nguyem' matches 'Nguyễn')
 * 3. Token-level & Substring similarity
 * 4. Fallback to Top 5 Near Matches when no exact matches are found
 */

/**
 * Remove Vietnamese accents and normalize string for comparison
 */
export function removeVietnameseAccents(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Single row memory optimization
  let prevRow: number[] = new Array(bl + 1);
  let currRow: number[] = new Array(bl + 1);

  for (let j = 0; j <= bl; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= al; i++) {
    currRow[0] = i;
    const aChar = a[i - 1];
    for (let j = 1; j <= bl; j++) {
      const cost = aChar === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[bl];
}

/**
 * Bigram Dice Coefficient for character level similarity (0 to 1)
 */
function getDiceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const getBigrams = (str: string) => {
    const s = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2);
      s.set(bg, (s.get(bg) || 0) + 1);
    }
    return s;
  };

  const aBigrams = getBigrams(a);
  const bBigrams = getBigrams(b);
  let intersection = 0;

  aBigrams.forEach((count, bg) => {
    if (bBigrams.has(bg)) {
      intersection += Math.min(count, bBigrams.get(bg)!);
    }
  });

  const total = (a.length - 1) + (b.length - 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

/**
 * Compute fuzzy similarity score between a query and a target string (0.0 to 1.0)
 */
export function computeSimilarityScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const qRaw = query.toLowerCase().trim();
  const tRaw = target.toLowerCase().trim();

  // 1. Exact raw match
  if (tRaw === qRaw) return 1.0;
  if (tRaw.includes(qRaw)) return 0.95;

  // 2. Unaccented match
  const qNorm = removeVietnameseAccents(query);
  const tNorm = removeVietnameseAccents(target);

  if (tNorm === qNorm) return 0.92;
  if (tNorm.includes(qNorm)) return 0.88;

  // 3. Token-level matching
  const qTokens = qNorm.split(/\s+/).filter(Boolean);
  const tTokens = tNorm.split(/\s+/).filter(Boolean);

  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  let tokenMatchScore = 0;
  for (const qTok of qTokens) {
    let bestTokScore = 0;
    for (const tTok of tTokens) {
      if (tTok === qTok) {
        bestTokScore = 1.0;
        break;
      }
      if (tTok.includes(qTok) || qTok.includes(tTok)) {
        const subScore = Math.min(qTok.length, tTok.length) / Math.max(qTok.length, tTok.length);
        bestTokScore = Math.max(bestTokScore, subScore * 0.85);
        continue;
      }
      const dist = levenshteinDistance(qTok, tTok);
      const maxLen = Math.max(qTok.length, tTok.length);
      if (maxLen > 0) {
        const levScore = 1 - dist / maxLen;
        // Only accept reasonably close typos (e.g. 1-2 char diff)
        if (levScore >= 0.5) {
          bestTokScore = Math.max(bestTokScore, levScore * 0.8);
        }
      }
    }
    tokenMatchScore += bestTokScore;
  }
  const avgTokenScore = tokenMatchScore / qTokens.length;

  // 4. Global string level Dice coefficient
  const diceScore = getDiceCoefficient(qNorm, tNorm);

  // Weighted combination
  return Math.max(avgTokenScore * 0.7 + diceScore * 0.3, avgTokenScore, diceScore);
}

/**
 * Filter items with Exact Match preference, falling back to Top N Near Matches if no exact match is found.
 */
export function filterWithNearMatchFallback<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  topN: number = 5,
  minThreshold: number = 0.22
): {
  results: T[];
  isNearMatch: boolean;
  matchCount: number;
} {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: items, isNearMatch: false, matchCount: items.length };
  }

  const qNorm = removeVietnameseAccents(trimmed);

  // 1. Try exact substring match (accented and unaccented)
  const exactMatches: T[] = [];
  items.forEach(item => {
    const text = getText(item);
    const textNorm = removeVietnameseAccents(text);
    if (textNorm.includes(qNorm)) {
      exactMatches.push(item);
    }
  });

  if (exactMatches.length > 0) {
    return { results: exactMatches, isNearMatch: false, matchCount: exactMatches.length };
  }

  // 2. No exact matches -> Find Top N Near Matches
  const scoredItems: { item: T; score: number }[] = [];

  items.forEach(item => {
    const text = getText(item);
    const score = computeSimilarityScore(trimmed, text);
    if (score >= minThreshold) {
      scoredItems.push({ item, score });
    }
  });

  // Sort descending by score
  scoredItems.sort((a, b) => b.score - a.score);

  const topMatches = scoredItems.slice(0, topN).map(s => s.item);

  return {
    results: topMatches,
    isNearMatch: topMatches.length > 0,
    matchCount: topMatches.length,
  };
}
