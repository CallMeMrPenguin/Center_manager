import React from 'react';

interface FormattedInsightTextProps {
  text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5-Color Tier Scale Helper (Đỏ -> Cam -> Vàng -> Xanh Nước Biển -> Xanh Lá Cây)
// ─────────────────────────────────────────────────────────────────────────────
function getNumberLevelColor(valStr: string): string {
  const trimmed = valStr.trim();

  // 1. Signed change: explicit positive (+) or negative (-)
  if (trimmed.startsWith('+')) return 'text-emerald-400 font-bold font-mono';
  if (trimmed.startsWith('-')) return 'text-rose-400 font-bold font-mono';

  // 2. Fractions (e.g. "7.1/10", "8.6/10", "10/19")
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator > 0) {
      if (denominator === 10) return getScore10Color(numerator);
      if (denominator === 100) return getScore100Color(numerator);
      const pct = (numerator / denominator) * 100;
      return getPercentageColor(pct);
    }
  }

  // 3. Percentages (e.g. "88%", "53%", "11%")
  if (trimmed.endsWith('%')) {
    const num = parseFloat(trimmed);
    if (!isNaN(num)) return getPercentageColor(num);
  }

  // 4. Scores with "đ" or "điểm" (e.g. "9.9 đ", "7.0 đ", "6.9 đ", "5.0 đ")
  const cleanNum = parseFloat(trimmed.replace(/[^\d.]/g, ''));
  if (!isNaN(cleanNum)) {
    if (trimmed.includes('đ') || trimmed.includes('điểm') || cleanNum <= 10) {
      return getScore10Color(cleanNum);
    }
    if (cleanNum <= 100) {
      return getScore100Color(cleanNum);
    }
    return 'text-sky-300 font-bold font-mono';
  }

  return 'text-white font-bold font-mono';
}

// Score on 0 - 10 scale
function getScore10Color(score: number): string {
  if (score >= 8.5) return 'text-emerald-400 font-bold font-mono'; // Xanh lá cây (Xuất sắc)
  if (score >= 7.0) return 'text-sky-400 font-bold font-mono';     // Xanh nước biển (Khá / Giỏi)
  if (score >= 5.5) return 'text-yellow-400 font-bold font-mono';  // Vàng (Trung bình khá)
  if (score >= 4.5) return 'text-orange-400 font-bold font-mono';  // Cam (Trung bình yếu)
  return 'text-rose-400 font-bold font-mono';                      // Đỏ (Kém / Nguy cơ)
}

// Score on 0 - 100 scale (PI, Performance Index)
function getScore100Color(score: number): string {
  if (score >= 85) return 'text-emerald-400 font-bold font-mono'; // Xanh lá cây
  if (score >= 70) return 'text-sky-400 font-bold font-mono';     // Xanh nước biển
  if (score >= 55) return 'text-yellow-400 font-bold font-mono';  // Vàng
  if (score >= 45) return 'text-orange-400 font-bold font-mono';  // Cam
  return 'text-rose-400 font-bold font-mono';                     // Đỏ
}

// Percentage scale 0% - 100%
function getPercentageColor(pct: number): string {
  if (pct >= 85) return 'text-emerald-400 font-bold font-mono'; // Xanh lá cây
  if (pct >= 70) return 'text-sky-400 font-bold font-mono';     // Xanh nước biển
  if (pct >= 50) return 'text-yellow-400 font-bold font-mono';  // Vàng
  if (pct >= 35) return 'text-orange-400 font-bold font-mono';  // Cam
  return 'text-rose-400 font-bold font-mono';                   // Đỏ
}

const PATTERNS: Array<{
  regex: RegExp;
  className?: string;
  isNumeric?: boolean;
}> = [
  // 1. Ranks
  { regex: /Quán Quân/g, className: 'text-amber-300 font-black' },
  { regex: /Cao Thủ/g, className: 'text-pink-400 font-black' },
  { regex: /Tinh Anh/g, className: 'text-purple-300 font-black' },
  { regex: /Kim Cương/g, className: 'text-cyan-400 font-black' },
  { regex: /Bạch Kim/g, className: 'text-indigo-300 font-bold' },
  { regex: /Vàng/g, className: 'text-yellow-400 font-bold' },
  { regex: /Bạc/g, className: 'text-sky-300 font-bold' },
  { regex: /Đồng/g, className: 'text-amber-500 font-bold' },

  // 2. Skills
  { regex: /Từ Vựng/g, className: 'text-blue-400 font-bold' },
  { regex: /Ngữ Pháp/g, className: 'text-purple-400 font-bold' },
  { regex: /BTVN/g, className: 'text-emerald-400 font-bold' },
  { regex: /Luyện Đề/g, className: 'text-amber-400 font-bold' },

  // 3. Technical symbols & formulas
  { regex: /σ\s*=\s*\d+(?:\.\d+)?/g, className: 'text-cyan-300 font-bold font-mono' },
  { regex: /IQR\s*=\s*\d+(?:\.\d+)?(?:\s*đ)?/g, className: 'text-amber-300 font-bold font-mono' },
  { regex: /(?:EMA_mới|EMA_cũ|EMA)/g, className: 'text-emerald-400 font-bold' },
  { regex: /(?:Performance Index|PI)/g, className: 'text-indigo-400 font-bold' },
  { regex: /#[0-9]+(?:\/[0-9]+)?/g, className: 'text-amber-300 font-black font-mono' },
  { regex: /Top\s+\d+%/gi, className: 'text-cyan-300 font-bold' },

  // 4. Dynamic Color Scale Numbers: Fractions, Deltas, Percentages, Scores with units
  { regex: /\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?\b/g, isNumeric: true },
  { regex: /\b\d+(?:\.\d+)?%/g, isNumeric: true },
  { regex: /[+-]\d+(?:\.\d+)?\s*(?:đ\/buổi|điểm|đ)\b/g, isNumeric: true },
  { regex: /[+-]\d+(?:\.\d+)?\b/g, isNumeric: true },
  { regex: /\b\d+(?:\.\d+)?\s*(?:đ\/buổi|điểm|đ)\b/g, isNumeric: true },

  // 5. Analytical qualitative phrases
  { regex: /(?:tiến bộ vượt bậc|tiến bộ đều đặn|bứt phá|xuất sắc|rất ổn định|vững vàng|chuyên cần xuất sắc|đối xứng chuẩn|rất tốt|đồng đều)/gi, className: 'text-emerald-400 font-bold' },
  { regex: /(?:suy giảm nhanh|hổng kiến thức|chưa đạt chuẩn|biến động rất mạnh|nguy cơ cao|sa sút)/gi, className: 'text-rose-400 font-bold' },
  { regex: /(?:mất cân bằng|suy giảm nhẹ|trồi sụt|cần hỗ trợ|cần phụ đạo|chững lại|phân cực học lực|lệch trái|lệch phải|phân hóa)/gi, className: 'text-amber-400 font-bold' },

  // 6. Standalone numbers / integers / floats
  { regex: /\b\d+(?:\.\d+)?\b/g, isNumeric: true },
];

export const FormattedInsightText: React.FC<FormattedInsightTextProps> = React.memo(({ text }) => {
  if (!text) return null;

  // Build a combined regex for replacement
  const combinedRegex = new RegExp(
    PATTERNS.map((p) => `(${p.regex.source})`).join('|'),
    'gi'
  );

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchedText = match[0];

    // Push preceding plain text
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // Determine which pattern matched
    let appliedClass = 'text-white font-bold';
    for (const pattern of PATTERNS) {
      const singleRegex = new RegExp(`^${pattern.regex.source}$`, pattern.regex.flags.replace('g', ''));
      if (singleRegex.test(matchedText)) {
        if (pattern.isNumeric) {
          appliedClass = getNumberLevelColor(matchedText);
        } else if (pattern.className) {
          appliedClass = pattern.className;
        }
        break;
      }
    }

    parts.push(
      <span key={`${matchIndex}-${matchedText}-${lastIndex}`} className={appliedClass}>
        {matchedText}
      </span>
    );

    lastIndex = combinedRegex.lastIndex;
  }

  // Push remainder
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
});
