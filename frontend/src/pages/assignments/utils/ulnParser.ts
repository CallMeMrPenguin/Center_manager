export interface UlnTableNode {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface UlnBoxNode {
  type: 'box';
  words: string[];
}

export interface UlnQuoteNode {
  type: 'quote';
  paragraphs: string[];
  notes?: string[];
}

export interface UlnTab2Node {
  type: 'tab2';
  items: { left: string; right: string }[];
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
  options?: string[];
  bracketHint?: string;
}

export interface UlnHeadingNode {
  type: 'h1' | 'h2' | 'ins' | 'paragraph';
  text: string;
}

export type UlnNode =
  | UlnTableNode
  | UlnBoxNode
  | UlnQuoteNode
  | UlnTab2Node
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
 * Parses raw ULN string or JSON into an AST of blocks
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
      // If it's a JSON array of questions, convert into UlnNodes
      const list = Array.isArray(parsed) ? parsed : (parsed.data || parsed.questions || []);
      if (list.length > 0) {
        return parseJsonQuestionList(list);
      }
    } catch {
      // Not JSON, continue to ULN text parser
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

    // 1. Heading 1 [H1]
    if (line.startsWith('[H1]')) {
      const content = cleanRawText(line.replace('[H1]', ''));
      nodes.push({ type: 'h1', text: content });
      i++;
      continue;
    }

    // 2. Heading 2 [H2]
    if (line.startsWith('[H2]')) {
      const content = cleanRawText(line.replace('[H2]', ''));
      nodes.push({ type: 'h2', text: content });
      i++;
      continue;
    }

    // 3. Instruction [ins] or [P0] [ins]
    if (line.includes('[ins]')) {
      const content = cleanRawText(line.replace(/\[P[0-9]\]/g, '').replace('[ins]', ''));
      nodes.push({ type: 'ins', text: content });
      i++;
      continue;
    }

    // 4. Word Box [BOX] ... [/BOX]
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
      const words = boxContent.split(/\s*\|\s*/).map((w) => w.trim()).filter(Boolean);
      nodes.push({ type: 'box', words: words.length > 0 ? words : boxContent.split(/\s+/).filter(Boolean) });
      i++;
      continue;
    }

    // 5. Table [TABLE] ... [/TABLE]
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

    // 6. Quote / Reading Passage [QUOTE] ... [/QUOTE]
    if (line.startsWith('[QUOTE]')) {
      i++;
      const paragraphs: string[] = [];
      const notes: string[] = [];

      while (i < lines.length && !lines[i].includes('[/QUOTE]')) {
        const qLine = lines[i].trim();
        if (qLine) {
          if (qLine.startsWith('[TAB2]') || qLine.startsWith('*-') || qLine.startsWith('-')) {
            const cleanNote = qLine.replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim();
            notes.push(cleanNote);
          } else {
            const cleanPara = qLine.replace(/\[P[0-9]\]/g, '').trim();
            paragraphs.push(cleanPara);
          }
        }
        i++;
      }
      nodes.push({ type: 'quote', paragraphs, notes: notes.length > 0 ? notes : undefined });
      i++;
      continue;
    }

    // 7. Matching Pairs [TAB2] #1. Left | a. Right
    if (line.includes('[TAB2]') && line.includes('|')) {
      const tabItems: { left: string; right: string }[] = [];
      while (i < lines.length && lines[i].includes('[TAB2]') && lines[i].includes('|')) {
        const itemLine = lines[i].replace(/\[TAB[0-9]\]/g, '').replace(/\[P[0-9]\]/g, '').trim();
        const parts = itemLine.split('|').map((p) => p.trim());
        if (parts.length >= 2) {
          tabItems.push({ left: parts[0], right: parts.slice(1).join(' | ') });
        }
        i++;
      }
      if (tabItems.length > 0) {
        nodes.push({ type: 'tab2', items: tabItems });
        continue;
      }
    }

    // 8. Multiple Choice Options [OPT] ... [/OPT]
    if (line.startsWith('[OPT]')) {
      const optStr = line.replace('[OPT]', '').replace('[/OPT]', '').trim();
      const options = optStr.split(/\s*\|\s*/).map((o) => o.trim()).filter(Boolean);

      // Check if previous node is a question to attach options to
      const lastNode = nodes[nodes.length - 1];
      if (lastNode && lastNode.type === 'question' && (!lastNode.options || lastNode.options.length === 0)) {
        lastNode.options = options;
      } else {
        // If standalone, check if it has #num
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

    // 9. Dialogue / Order items (lines starting with <blank> or single digit)
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

      // Check next line for subtext like [P1] B: ... or [P1] → ...
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('[P1]') || nextLine.startsWith('→') || nextLine.startsWith('B:')) {
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
