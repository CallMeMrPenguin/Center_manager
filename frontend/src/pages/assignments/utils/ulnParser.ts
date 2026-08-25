import { UlnNode, UlnHeadingNode } from './ulnTypes';

export * from './ulnTypes';

export function extractAlignment(str: string): { text: string; align?: 'left' | 'center' | 'right' } {
  let align: 'left' | 'center' | 'right' | undefined;
  let text = str;

  if (/\[(?:center|align:center|P[0-9]:center)\]/i.test(text)) {
    align = 'center';
    text = text.replace(/\[(?:center|align:center|P[0-9]:center)\]/gi, '').replace(/\[\/center\]/gi, '').trim();
  } else if (/\[(?:right|align:right|P[0-9]:right)\]/i.test(text)) {
    align = 'right';
    text = text.replace(/\[(?:right|align:right|P[0-9]:right)\]/gi, '').replace(/\[\/right\]/gi, '').trim();
  } else if (/\[(?:left|align:left|P[0-9]:left)\]/i.test(text)) {
    align = 'left';
    text = text.replace(/\[(?:left|align:left|P[0-9]:left)\]/gi, '').replace(/\[\/left\]/gi, '').trim();
  }

  return { text, align };
}

export function cleanRawText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^\[P[0-9](?::(?:center|right|left))?\]\s*/gi, '')
    .replace(/^\[(?:ins|center|right|left|align:center|align:right|align:left)\]\s*/gi, '')
    .replace(/\[\/(?:center|right|left)\]/gi, '')
    .replace(/^#\s*/g, '')
    .replace(/^\*\*([^*]+)\*\*$/g, '$1')
    .trim();
}

export function parseUlnContent(rawContent: string): UlnNode[] {
  if (!rawContent || !rawContent.trim()) return [];
  const text = rawContent.trim();

  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') return parseUlnText(parsed);
      const list = Array.isArray(parsed) ? parsed : (parsed.data || parsed.questions || []);
      if (list.length > 0) return parseJsonQuestionList(list);
    } catch {
      // Fall through to parseUlnText
    }
  }

  return parseUlnText(text);
}

function parseJsonQuestionList(dataList: any[]): UlnNode[] {
  const nodes: UlnNode[] = [];
  dataList.forEach((item, idx) => {
    if (item.x && ['pr', 'wb', 'fb', 'rw', 'rd', 'cz'].includes(item.t)) {
      nodes.push({ type: 'ins', text: `${item.title_prefix ? item.title_prefix + ' ' : ''}${item.x}` });
    }
    if (item.w && Array.isArray(item.w) && item.w.length > 0) {
      nodes.push({ type: 'box', words: item.w });
    }
    if (item.b && typeof item.b === 'string') {
      nodes.push({ type: 'quote', paragraphs: [item.b] });
    }
    if (item.k && Array.isArray(item.k)) {
      item.k.forEach((sub: any, sIdx: number) => {
        nodes.push({
          type: 'question',
          qNum: sub.q || String(sIdx + 1),
          text: sub.x || '',
          options: sub.o,
          hasWritingLine: !sub.o || sub.o.length === 0,
        });
      });
    } else if (item.q || item.o || item.x) {
      nodes.push({
        type: 'question',
        qNum: item.q || String(idx + 1),
        text: item.x || '',
        options: item.o,
        hasWritingLine: !item.o || item.o.length === 0,
      });
    }
  });
  return nodes;
}

export function parseUlnText(ulnText: string): UlnNode[] {
  const lines = ulnText.split('\n');
  const nodes: UlnNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Filter out Answer Key headings from test paper
    if (
      line.match(/^\[H[1-6]\]\s*\*\*(?:ANSWER KEY|ĐÁP ÁN|ANSWER KEYS)\*\*/i) ||
      line.match(/^\[H[1-6]\]\s*(?:ANSWER KEY|ĐÁP ÁN|ANSWER KEYS)/i) ||
      line.match(/^\*\*(?:ANSWER KEY|ĐÁP ÁN|ANSWER KEYS)\*\*/i)
    ) {
      i++;
      continue;
    }

    // Filter out and parse Answer Key Line [ANS] ... [/ANS]
    if (line.startsWith('\\ans:') || line.startsWith('[ANS]')) {
      let rawAns = line.replace('\\ans:', '').replace('[ANS]', '').replace('[/ANS]', '').trim();
      if (!line.includes('[/ANS]')) {
        i++;
        while (i < lines.length && !lines[i].includes('[/ANS]')) {
          rawAns += '\n' + lines[i].trim();
          i++;
        }
        if (i < lines.length) {
          rawAns += '\n' + lines[i].replace('[/ANS]', '').trim();
        }
      }
      const keys = rawAns.split(/\s*\|\s*|\s*,\s*|\n+/).filter(Boolean);
      const lastIns = [...nodes].reverse().find((n) => n.type === 'ins') as UlnHeadingNode | undefined;
      if (lastIns) lastIns.answerKey = keys;
      i++;
      continue;
    }

    // Extract line-level alignment if present ([center], [right], [left])
    const { text: lineWithoutAlign, align: lineAlign } = extractAlignment(line);

    // 1. Headings [H1] - [H6]
    const hMatch = lineWithoutAlign.match(/^\[H([1-6])\]\s*(.*)/i);
    if (hMatch) {
      const level = parseInt(hMatch[1]) as 1 | 2 | 3 | 4 | 5 | 6;
      nodes.push({ type: `h${level}` as any, text: cleanRawText(hMatch[2]), align: lineAlign || (level === 1 ? 'center' : undefined) });
      i++;
      continue;
    }

    // 2. Exercise Instruction [ins]
    if (line.includes('[ins]')) {
      let content = lineWithoutAlign.replace(/^\[P[0-9]\]\s*/g, '').replace(/^\[ins\]\s*/g, '').trim();
      let answerCount: number | undefined;
      const countMatch = content.match(/<@(\d+)>/);
      if (countMatch) {
        answerCount = parseInt(countMatch[1]);
        content = content.replace(/<@\d+>/g, '').trim();
      }
      nodes.push({ type: 'ins', text: content, align: lineAlign, answerCount });
      i++;
      continue;
    }

    // 3. Word Box or Grammar Formula [BOX] ... [/BOX]
    if (line.startsWith('[BOX]')) {
      let boxContent = line.replace('[BOX]', '').replace('[/BOX]', '').trim();
      if (!line.includes('[/BOX]')) {
        i++;
        while (i < lines.length && !lines[i].includes('[/BOX]')) {
          boxContent += ' ' + lines[i].trim();
          i++;
        }
        if (i < lines.length) {
          boxContent += ' ' + lines[i].replace('[/BOX]', '').trim();
        }
      }
      if (boxContent.includes('|')) {
        nodes.push({ type: 'box', words: boxContent.split(/\s*\|\s*/).map((w) => w.trim()).filter(Boolean) });
      } else {
        nodes.push({ type: 'box', isFormula: true, content: boxContent });
      }
      i++;
      continue;
    }

    // 4. Picture Grid [PIC_GRID] ... [/PIC_GRID]
    if (line.startsWith('[PIC_GRID]')) {
      i++;
      const gridRows: string[][] = [];
      while (i < lines.length && !lines[i].includes('[/PIC_GRID]')) {
        const pLine = lines[i].trim();
        if (pLine) gridRows.push(pLine.split('|').map((s) => s.trim()).filter(Boolean));
        i++;
      }
      nodes.push({ type: 'pic_grid', rows: gridRows });
      i++;
      continue;
    }

    // 5. Bordered Grid Table [TABLE] ... [/TABLE]
    if (line.startsWith('[TABLE]')) {
      i++;
      let headers: string[] = [];
      const rows: string[][] = [];
      while (i < lines.length && !lines[i].includes('[/TABLE]')) {
        const tLine = lines[i].trim();
        if (tLine.startsWith('[TH]')) {
          headers = tLine.replace('[TH]', '').split('|').map((s) => s.trim());
        } else if (tLine.startsWith('[TR]')) {
          rows.push(tLine.replace('[TR]', '').split('|').map((s) => s.replace(/(^|\s)#([0-9]+)/g, '$1$2').trim()));
        }
        i++;
      }
      nodes.push({ type: 'table', headers, rows });
      i++;
      continue;
    }

    // 6. Reading Passage Quote [QUOTE] ... [/QUOTE]
    if (line.startsWith('[QUOTE]')) {
      i++;
      let title: string | undefined;
      const paragraphs: string[] = [];
      const notes: string[] = [];
      while (i < lines.length && !lines[i].includes('[/QUOTE]')) {
        const qLine = lines[i].trim();
        if (qLine) {
          if (qLine.startsWith('[TAB2]') || qLine.startsWith('*-') || qLine.startsWith('-')) {
            notes.push(qLine.replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim());
          } else if (qLine.startsWith('[P0] **') && !title) {
            title = cleanRawText(qLine);
          } else {
            paragraphs.push(qLine.replace(/\[P[0-9]\]/g, '').trim());
          }
        }
        i++;
      }
      nodes.push({ type: 'quote', title, paragraphs, notes: notes.length > 0 ? notes : undefined });
      i++;
      continue;
    }

    // 7. Multi-Column Layouts [TAB2], [TAB3], [TAB4]
    const tabMatch = line.match(/^\[TAB([2-4])\]/);
    if (tabMatch && line.includes('|')) {
      const colCount = parseInt(tabMatch[1]);
      const items: string[][] = [];
      while (i < lines.length && lines[i].includes(`[TAB${colCount}]`) && lines[i].includes('|')) {
        const parts = lines[i].replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim().split('|').map((p) => p.replace(/(^|\s)#([0-9]+)/g, '$1$2').trim());
        items.push(parts);
        i++;
      }
      if (items.length > 0) {
        nodes.push({ type: 'tab_cols', cols: colCount, items });
        continue;
      }
    }

    // 8. Multiple Choice Options [OPT] ... [/OPT]
    if (line.startsWith('[OPT]')) {
      const optStr = line.replace('[OPT]', '').replace('[/OPT]', '').trim();
      const options = optStr.split(/\s*\|\s*/).map((o) => o.trim()).filter(Boolean);
      const lastNode = nodes[nodes.length - 1];
      if (lastNode && lastNode.type === 'question' && (!lastNode.options || lastNode.options.length === 0)) {
        lastNode.options = options;
      } else {
        const numMatch = optStr.match(/^#([0-9]+)\.\s*(.*)/);
        if (numMatch) {
          nodes.push({ type: 'question', qNum: numMatch[1], text: '', options: numMatch[2].split(/\s*\|\s*/).map((o) => o.trim()) });
        } else {
          nodes.push({ type: 'question', text: '', options });
        }
      }
      i++;
      continue;
    }

    // 9. Dialogue Reordering Lines
    const strippedDialogue = line.replace(/^\[P[0-9]\]\s*/, '');
    if (strippedDialogue.startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(strippedDialogue)) {
      const dialogueItems: { initialNum?: string; text: string }[] = [];
      while (i < lines.length) {
        const curr = lines[i].replace(/^\[P[0-9]\]\s*/, '').trim();
        if (curr.startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(curr)) {
          const numM = curr.match(/^([0-9])\s+(.*)/);
          dialogueItems.push(numM ? { initialNum: numM[1], text: numM[2] } : { text: curr.replace(/^<blank>\s*/, '') });
          i++;
        } else {
          break;
        }
      }
      if (dialogueItems.length > 0) {
        nodes.push({ type: 'dialogue_order', items: dialogueItems });
        continue;
      }
    }

    // 10. Numbered Question Line
    const qMatch = lineWithoutAlign.match(/^(?:\[P[0-9]\]\s*)?(?:(?:Question|Câu)\s+)?#?([0-9]+)\.\s*(.*)$/i);
    if (qMatch) {
      const qNum = qMatch[1];
      let qText = qMatch[2].replace(/^#/, '').trim();
      let subText: string | undefined;
      const subParagraphs: string[] = [];
      let bracketHint: string | undefined;
      let hasWritingLine = false;

      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (!nextLine) { i++; continue; }
        if (nextLine === '[P1] <blank>' || nextLine === '<blank>') {
          hasWritingLine = true;
          i++;
          continue;
        }
        if (
          nextLine.startsWith('[OPT]') ||
          nextLine.startsWith('[NUM]') ||
          nextLine.startsWith('[/NUM]') ||
          nextLine.startsWith('[H') ||
          nextLine.startsWith('[ins]') ||
          nextLine.startsWith('[QUOTE]') ||
          nextLine.startsWith('[TABLE]') ||
          nextLine.startsWith('[BOX]') ||
          /^(?:\[P[0-9]\]\s*)?(?:(?:Question|Câu)\s+)?#?[0-9]+\./i.test(nextLine)
        ) {
          break;
        }
        if (nextLine.startsWith('[P1]') || nextLine.startsWith('[P2]') || nextLine.startsWith('→') || nextLine.startsWith('B:')) {
          const cleanSub = nextLine.replace(/^\[P[1-2]\]\s*/, '').replace(/^#/, '').trim();
          if (cleanSub.includes('<blank>') || cleanSub.startsWith('→') || cleanSub.startsWith('B:')) {
            subText = cleanSub;
          } else {
            subParagraphs.push(cleanSub);
          }
          i++;
          continue;
        }
        break;
      }

      const bracketM = qText.match(/\(([^)]+)\)$/);
      if (bracketM) bracketHint = bracketM[1];

      nodes.push({
        type: 'question',
        qNum,
        text: qText,
        subText,
        subParagraphs: subParagraphs.length > 0 ? subParagraphs : undefined,
        bracketHint,
        hasWritingLine,
        align: lineAlign,
      });
      i++;
      continue;
    }

    // Default: Clean paragraph or container tags
    if (line !== '[NUM]' && line !== '[/NUM]') {
      const cleanP = cleanRawText(lineWithoutAlign);
      if (cleanP) nodes.push({ type: 'paragraph', text: cleanP, align: lineAlign });
    }
    i++;
  }

  return nodes;
}
