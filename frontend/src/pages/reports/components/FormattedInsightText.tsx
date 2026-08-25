import React from 'react';

interface FormattedInsightTextProps {
  text: string;
}

const PATTERNS: Array<{
  regex: RegExp;
  className: string;
}> = [
  // Ranks
  { regex: /\bQuán Quân\b/g, className: 'text-amber-300 font-black' },
  { regex: /\bCao Thủ\b/g, className: 'text-pink-400 font-black' },
  { regex: /\bTinh Anh\b/g, className: 'text-purple-300 font-black' },
  { regex: /\bKim Cương\b/g, className: 'text-cyan-400 font-black' },
  { regex: /\bBạch Kim\b/g, className: 'text-indigo-300 font-bold' },
  { regex: /\bVàng\b/g, className: 'text-yellow-400 font-bold' },
  { regex: /\bBạc\b/g, className: 'text-sky-300 font-bold' },
  { regex: /\bĐồng\b/g, className: 'text-amber-500 font-bold' },

  // Skills
  { regex: /\bTừ Vựng\b/g, className: 'text-blue-400 font-bold' },
  { regex: /\bNgữ Pháp\b/g, className: 'text-purple-400 font-bold' },
  { regex: /\bBTVN\b/g, className: 'text-emerald-400 font-bold' },
  { regex: /\bLuyện Đề\b/g, className: 'text-amber-400 font-bold' },

  // Statistics & Metrics
  { regex: /\b(?:EMA|EMA_mới|EMA_cũ)\b/g, className: 'text-emerald-400 font-bold' },
  { regex: /\b(?:PI|Performance Index)\b/g, className: 'text-indigo-400 font-bold' },
  { regex: /σ\s*=\s*\d+(?:\.\d+)?/g, className: 'text-cyan-300 font-bold font-mono' },
  { regex: /IQR\s*=\s*\d+(?:\.\d+)?\s*đ?/g, className: 'text-amber-300 font-bold font-mono' },
  { regex: /#[0-9]+(?:\/[0-9]+)?/g, className: 'text-amber-300 font-black font-mono' },
  { regex: /Top\s+\d+%/gi, className: 'text-cyan-300 font-bold' },
  { regex: /[+-]\d+(?:\.\d+)?\s*(?:đ\/buổi|điểm|đ)/g, className: 'text-emerald-400 font-bold font-mono' },
  { regex: /\b\d+(?:\.\d+)?\s*(?:đ\/buổi|đ|điểm|\/10|\/100|%|lượt|buổi học|học sinh)\b/g, className: 'text-amber-300 font-bold font-mono' },

  // Analytical qualitative phrases
  { regex: /\b(?:tiến bộ vượt bậc|bứt phá|xuất sắc|rất ổn định|vững vàng|chuyên cần xuất sắc|đối xứng chuẩn|rất tốt)\b/gi, className: 'text-emerald-400 font-bold' },
  { regex: /\b(?:suy giảm nhanh|hổng kiến thức|chưa đạt chuẩn|biến động rất mạnh|nguy cơ cao)\b/gi, className: 'text-rose-400 font-bold' },
  { regex: /\b(?:mất cân bằng|suy giảm nhẹ|trồi sụt|cần hỗ trợ|cần phụ đạo|chững lại|phân cực học lực|lệch trái|lệch phải)\b/gi, className: 'text-amber-400 font-bold' },
];

export const FormattedInsightText: React.FC<FormattedInsightTextProps> = React.memo(({ text }) => {
  if (!text) return null;

  // Build a combined regex for replacement
  const combinedRegex = new RegExp(
    PATTERNS.map((p) => `(${p.regex.source})`).join('|'),
    'g'
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
        appliedClass = pattern.className;
        break;
      }
    }

    parts.push(
      <span key={`${matchIndex}-${matchedText}`} className={appliedClass}>
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
