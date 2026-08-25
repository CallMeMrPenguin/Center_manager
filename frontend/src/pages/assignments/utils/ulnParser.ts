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
  hasWritingLine?: boolean;
  options?: string[];
  bracketHint?: string;
  picRight?: string;
}

export interface UlnHeadingNode {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'ins' | 'paragraph';
  text: string;
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

/**
 * Strips formatting markers from text like [P0], [P1], **bold**, etc.
 */
export function cleanRawText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^\[P[0-9]\]\s*/g, '')
    .replace(/^\[ins\]\s*/g, '')
    .replace(/^\*\*([^*]+)\*\*$/g, '$1')
    .trim();
}

/**
 * Universal Layout Notation (ULN) Parser
 */
export function parseUlnContent(rawContent: string): UlnNode[] {
  if (!rawContent || !rawContent.trim()) return [];

  const text = rawContent.trim();

  // If content is a valid JSON array or object, check if it's already structured JSON
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        return parseUlnText(parsed);
      }
      const list = Array.isArray(parsed) ? parsed : (parsed.data || parsed.questions || []);
      if (list.length > 0) {
        return parseJsonQuestionList(list);
      }
    } catch {
      // Not JSON, parse as ULN text
    }
  }

  return parseUlnText(text);
}

function parseJsonQuestionList(list: any[]): UlnNode[] {
  const nodes: UlnNode[] = [];
  list.forEach((item, idx) => {
    if (item.title_prefix || item.section_title) {
      nodes.push({ type: 'h2', text: item.title_prefix || item.section_title });
    }
    if (item.w && Array.isArray(item.w) && item.w.length > 0) {
      nodes.push({ type: 'box', words: item.w });
    }
    if (item.b && typeof item.b === 'string' && item.b.trim()) {
      nodes.push({ type: 'quote', paragraphs: [item.b] });
    }
    if (item.k && Array.isArray(item.k)) {
      item.k.forEach((sub: any, sIdx: number) => {
        nodes.push({
          type: 'question',
          qNum: String(sub.q || sIdx + 1),
          text: sub.x || sub.text || `Câu hỏi ${sIdx + 1}`,
          options: Array.isArray(sub.o) ? sub.o : undefined,
        });
      });
    } else {
      nodes.push({
        type: 'question',
        qNum: String(item.q || idx + 1),
        text: item.x || item.text || `Câu hỏi ${idx + 1}`,
        options: Array.isArray(item.o) ? item.o : undefined,
      });
    }
  });
  return nodes;
}

function parseUlnText(text: string): UlnNode[] {
  const lines = text.split(/\r?\n/);
  const nodes: UlnNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // 1. Headings [H1] to [H6]
    const hMatch = line.match(/^\[H([1-6])\]\s*(.*)/);
    if (hMatch) {
      const level = parseInt(hMatch[1]);
      const type = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      nodes.push({ type, text: cleanRawText(hMatch[2]) });
      i++;
      continue;
    }

    // 2. Exercise Instruction [ins] or [P0] [ins]
    if (line.includes('[ins]')) {
      const content = cleanRawText(line.replace(/\[P[0-9]\]/g, '').replace('[ins]', ''));
      nodes.push({ type: 'ins', text: content });
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
        const words = boxContent.split(/\s*\|\s*/).map((w) => w.trim()).filter(Boolean);
        nodes.push({ type: 'box', words });
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
        if (pLine) {
          const cells = pLine.split('|').map((s) => s.trim()).filter(Boolean);
          gridRows.push(cells);
        }
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
          const cells = tLine.replace('[TR]', '').split('|').map((s) => s.trim());
          rows.push(cells);
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
            const cleanNote = qLine.replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim();
            notes.push(cleanNote);
          } else if (qLine.startsWith('[P0] **') && !title) {
            title = cleanRawText(qLine);
          } else {
            const cleanPara = qLine.replace(/\[P[0-9]\]/g, '').trim();
            paragraphs.push(cleanPara);
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
        const itemLine = lines[i].replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim();
        const parts = itemLine.split('|').map((p) => p.trim());
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
          const rawOpts = numMatch[2].split(/\s*\|\s*/).map((o) => o.trim());
          nodes.push({
            type: 'question',
            qNum: numMatch[1],
            text: `Câu ${numMatch[1]}`,
            options: rawOpts,
          });
        } else {
          nodes.push({
            type: 'question',
            text: 'Chọn đáp án đúng:',
            options,
          });
        }
      }
      i++;
      continue;
    }

    // 9. Dialogue Reordering Lines (<blank> text or 1 text)
    if (line.startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(line)) {
      const dialogueItems: { initialNum?: string; text: string }[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(lines[i].trim()))) {
        const dLine = lines[i].replace(/\[P[0-9]\]/g, '').trim();
        const numM = dLine.match(/^([0-9])\s+(.*)/);
        if (numM) {
          dialogueItems.push({ initialNum: numM[1], text: numM[2] });
        } else {
          dialogueItems.push({ text: dLine.replace(/^<blank>\s*/, '') });
        }
        i++;
      }
      if (dialogueItems.length > 0) {
        nodes.push({ type: 'dialogue_order', items: dialogueItems });
        continue;
      }
    }

    // 10. Numbered Question Line (e.g. [P0] #1. text, #1. text, 1. text)
    const qMatch = line.match(/(?:\[P[0-9]\]\s*)?#?([0-9]+)\.\s*(.*)/);
    if (qMatch) {
      const qNum = qMatch[1];
      let qText = qMatch[2].trim();
      let subText: string | undefined;
      let bracketHint: string | undefined;
      let hasWritingLine = false;

      // Check next line for subtext like [P1] B: ..., [P1] → ..., or [P1] <blank>
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine === '[P1] <blank>' || nextLine === '<blank>') {
          hasWritingLine = true;
          i++;
        } else if (nextLine.startsWith('[P1]') || nextLine.startsWith('→') || nextLine.startsWith('B:')) {
          subText = nextLine.replace(/^\[P1\]\s*/, '').trim();
          i++;
        }
      }

      // Check for bracket hints at end like (native/ local) or (not visit)
      const bracketM = qText.match(/\(([^)]+)\)$/);
      if (bracketM) {
        bracketHint = bracketM[1];
      }

      nodes.push({
        type: 'question',
        qNum,
        text: qText,
        subText,
        bracketHint,
        hasWritingLine,
      });
      i++;
      continue;
    }

    // Default: Clean paragraph or container tags
    if (line !== '[NUM]' && line !== '[/NUM]') {
      const cleanP = cleanRawText(line);
      if (cleanP) {
        nodes.push({ type: 'paragraph', text: cleanP });
      }
    }
    i++;
  }

  return nodes;
}
