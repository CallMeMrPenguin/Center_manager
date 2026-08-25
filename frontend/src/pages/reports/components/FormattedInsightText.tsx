import React from 'react';

interface FormattedInsightTextProps {
  text: string;
}

const PATTERNS: Array<{
  regex: RegExp;
  className: string;
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

  // 4. Fractions, Signed Deltas, Percentages, Scores with units
  { regex: /\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?\b/g, className: 'text-amber-300 font-bold font-mono' },
  { regex: /\b\d+(?:\.\d+)?%/g, className: 'text-amber-300 font-bold font-mono' },
  { regex: /[+-]\d+(?:\.\d+)?\s*(?:đ\/buổi|điểm|đ)\b/g, className: 'text-emerald-400 font-bold font-mono' },
  { regex: /\b\d+(?:\.\d+)?\s*(?:đ\/buổi|điểm|đ)\b/g, className: 'text-amber-300 font-bold font-mono' },

  // 5. Analytical qualitative phrases
  { regex: /(?:tiến bộ vượt bậc|tiến bộ đều đặn|bứt phá|xuất sắc|rất ổn định|vững vàng|chuyên cần xuất sắc|đối xứng chuẩn|rất tốt|đồng đều)/gi, className: 'text-emerald-400 font-bold' },
  { regex: /(?:suy giảm nhanh|hổng kiến thức|chưa đạt chuẩn|biến động rất mạnh|nguy cơ cao)/gi, className: 'text-rose-400 font-bold' },
  { regex: /(?:mất cân bằng|suy giảm nhẹ|trồi sụt|cần hỗ trợ|cần phụ đạo|chững lại|phân cực học lực|lệch trái|lệch phải|phân hóa)/gi, className: 'text-amber-400 font-bold' },

  // 6. Standalone numbers / integers / floats (e.g. 57, 19, 2, 10, 7.1)
  { regex: /\b\d+(?:\.\d+)?\b/g, className: 'text-amber-300 font-bold font-mono' },
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
        appliedClass = pattern.className;
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
