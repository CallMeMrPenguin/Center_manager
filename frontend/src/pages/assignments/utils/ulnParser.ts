import {
  UlnNode,
  UlnHeadingNode,
} from './ulnTypes';

export * from './ulnTypes';

/**
 * Strips formatting markers from text like [P0], [P1], **bold**, etc.
 */
export function cleanRawText(str: string): string {
  if (!str) return '';
  return str
    .replace(/^\[P[0-9]\]\s*/g, '')
    .replace(/^\[ins\]\s*/g, '')
    .replace(/^#\s*/g, '')
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

/**
 * Parses JSON question list into ULN Nodes
 */
function parseJsonQuestionList(dataList: any[]): UlnNode[] {
  const nodes: UlnNode[] = [];

  dataList.forEach((item, idx) => {
    // Instruction / Section header
    if (item.x && (item.t === 'pr' || item.t === 'wb' || item.t === 'fb' || item.t === 'rw' || item.t === 'rd' || item.t === 'cz')) {
      const title = `${item.title_prefix ? item.title_prefix + ' ' : ''}${item.x}`;
      nodes.push({ type: 'ins', text: title });
    }

    // Word box if present
    if (item.w && Array.isArray(item.w) && item.w.length > 0) {
      nodes.push({ type: 'box', words: item.w });
    }

    // Passage text if present
    if (item.b && typeof item.b === 'string') {
      nodes.push({ type: 'quote', paragraphs: [item.b] });
    }

    // Sub questions
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

/**
 * Line-by-line DSL Parser for ULN Content
 */
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

    // 1. Headings [H1] - [H6]
    const hMatch = line.match(/^\[H([1-6])\]\s*(.*)/i);
    if (hMatch) {
      const level = parseInt(hMatch[1]) as 1 | 2 | 3 | 4 | 5 | 6;
      const headingType = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      const cleanHeading = cleanRawText(hMatch[2]);
      nodes.push({ type: headingType, text: cleanHeading });
      i++;
      continue;
    }

    // 2. Exercise Instruction [ins] (e.g. [P0] [ins]**I. Choose the best answer** <@10>)
    if (line.includes('[ins]')) {
      let content = cleanRawText(line);
      let answerCount: number | undefined;

      const countMatch = content.match(/<@(\d+)>/);
      if (countMatch) {
        answerCount = parseInt(countMatch[1]);
        content = content.replace(/<@\d+>/g, '').trim();
      }

      nodes.push({ type: 'ins', text: content, answerCount });
      i++;
      continue;
    }

    // Answer Key Line \ans: ... or [ANS] ... [/ANS]
    if (line.startsWith('\\ans:') || line.startsWith('[ANS]')) {
      const rawAns = line.replace('\\ans:', '').replace('[ANS]', '').replace('[/ANS]', '').trim();
      const keys = rawAns.split(/\s*\|\s*|\s*,\s*|\s+/).filter(Boolean);
      const lastIns = [...nodes].reverse().find((n) => n.type === 'ins') as UlnHeadingNode | undefined;
      if (lastIns) {
        lastIns.answerKey = keys;
      }
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
          const cells = tLine.replace('[TR]', '').split('|').map((s) => s.replace(/(^|\s)#([0-9]+)/g, '$1$2').trim());
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
        const parts = itemLine.split('|').map((p) => p.replace(/(^|\s)#([0-9]+)/g, '$1$2').trim());
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
            text: '',
            options: rawOpts,
          });
        } else {
          nodes.push({
            type: 'question',
            text: '',
            options,
          });
        }
      }
      i++;
      continue;
    }

    // 9. Dialogue Reordering Lines (<blank> text or 1 text)
    const strippedDialogueLine = line.replace(/^\[P[0-9]\]\s*/, '');
    if (strippedDialogueLine.startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(strippedDialogueLine)) {
      const dialogueItems: { initialNum?: string; text: string }[] = [];
      while (i < lines.length) {
        const currStripped = lines[i].replace(/^\[P[0-9]\]\s*/, '').trim();
        if (currStripped.startsWith('<blank>') || /^[0-9]\s+[A-Z]/.test(currStripped)) {
          const numM = currStripped.match(/^([0-9])\s+(.*)/);
          if (numM) {
            dialogueItems.push({ initialNum: numM[1], text: numM[2] });
          } else {
            dialogueItems.push({ text: currStripped.replace(/^<blank>\s*/, '') });
          }
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

    // 10. Numbered Question Line (Anchored strictly to start of line to prevent false matches in money/numbers like $500.)
    const qMatch = line.match(/^(?:\[P[0-9]\]\s*)?(?:(?:Question|Câu)\s+)?#?([0-9]+)\.\s*(.*)$/i);
    if (qMatch) {
      const qNum = qMatch[1];
      let qText = qMatch[2].replace(/^#/, '').trim();
      let subText: string | undefined;
      const subParagraphs: string[] = [];
      let bracketHint: string | undefined;
      let hasWritingLine = false;

      // Read following context lines [P1], sublines, or <blank> until next question or tag
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (!nextLine) {
          i++;
          continue;
        }
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
      if (bracketM) {
        bracketHint = bracketM[1];
      }

      nodes.push({
        type: 'question',
        qNum,
        text: qText,
        subText,
        subParagraphs: subParagraphs.length > 0 ? subParagraphs : undefined,
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
