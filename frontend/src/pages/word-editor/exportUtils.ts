import mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  convertMillimetersToTwip,
  PageOrientation,
} from 'docx';
import { MarginConfig, Orientation } from './types';

/**
 * Import a .docx file and convert its content into HTML for TipTap
 */
export async function importFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value || '';
}

function parseTextRuns(node: Node): TextRun[] {
  const runs: TextRun[] = [];

  function walk(curr: Node, formatting: { bold?: boolean; italics?: boolean; underline?: boolean; strike?: boolean; color?: string }) {
    if (curr.nodeType === Node.TEXT_NODE) {
      const text = curr.textContent || '';
      if (text) {
        runs.push(
          new TextRun({
            text,
            bold: formatting.bold,
            italics: formatting.italics,
            underline: formatting.underline ? {} : undefined,
            strike: formatting.strike,
            color: formatting.color,
            font: 'Arial',
            size: 24, // 12pt
          })
        );
      }
      return;
    }

    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const nextFmt = { ...formatting };

      if (tagName === 'strong' || tagName === 'b') nextFmt.bold = true;
      if (tagName === 'em' || tagName === 'i') nextFmt.italics = true;
      if (tagName === 'u') nextFmt.underline = true;
      if (tagName === 's' || tagName === 'strike') nextFmt.strike = true;

      // Color from style
      const styleColor = el.style.color;
      if (styleColor) {
        const hex = styleColor.startsWith('#') ? styleColor.replace('#', '') : undefined;
        if (hex && hex.length === 6) nextFmt.color = hex;
      }

      el.childNodes.forEach((child) => walk(child, nextFmt));
    }
  }

  node.childNodes.forEach((child) => walk(child, {}));
  return runs;
}

function getAlignment(el: HTMLElement): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const align = el.style.textAlign || el.getAttribute('align') || '';
  if (align === 'center') return AlignmentType.CENTER;
  if (align === 'right') return AlignmentType.RIGHT;
  if (align === 'justify') return AlignmentType.JUSTIFIED;
  return AlignmentType.LEFT;
}

function convertDomToDocxChildren(container: HTMLElement): any[] {
  const children: any[] = [];

  for (let i = 0; i < container.children.length; i++) {
    const el = container.children[i] as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const levelMap: Record<string, any> = {
        h1: HeadingLevel.HEADING_1,
        h2: HeadingLevel.HEADING_2,
        h3: HeadingLevel.HEADING_3,
        h4: HeadingLevel.HEADING_4,
        h5: HeadingLevel.HEADING_5,
        h6: HeadingLevel.HEADING_6,
      };
      children.push(
        new Paragraph({
          heading: levelMap[tag],
          alignment: getAlignment(el),
          children: parseTextRuns(el),
          spacing: { before: 200, after: 120 },
        })
      );
    }
    // Paragraph
    else if (tag === 'p') {
      children.push(
        new Paragraph({
          alignment: getAlignment(el),
          children: parseTextRuns(el),
          spacing: { after: 120, line: 276 },
        })
      );
    }
    // Lists
    else if (tag === 'ul' || tag === 'ol') {
      const isOrdered = tag === 'ol';
      const items = Array.from(el.querySelectorAll(':scope > li'));
      items.forEach((li, idx) => {
        const liEl = li as HTMLElement;
        const runs = parseTextRuns(liEl);
        if (isOrdered) {
          runs.unshift(new TextRun({ text: `${idx + 1}. `, bold: true }));
        }
        children.push(
          new Paragraph({
            bullet: isOrdered ? undefined : { level: 0 },
            children: runs,
            spacing: { after: 60 },
          })
        );
      });
    }
    // Table
    else if (tag === 'table') {
      const domRows = Array.from(el.querySelectorAll('tr'));
      if (domRows.length > 0) {
        const tableRows: TableRow[] = domRows.map((tr) => {
          const domCells = Array.from(tr.querySelectorAll('th, td'));
          const cells: TableCell[] = domCells.map((td) => {
            const cellEl = td as HTMLElement;
            return new TableCell({
              children: [
                new Paragraph({
                  alignment: getAlignment(cellEl),
                  children: parseTextRuns(cellEl),
                }),
              ],
              margins: {
                top: convertMillimetersToTwip(2),
                bottom: convertMillimetersToTwip(2),
                left: convertMillimetersToTwip(3),
                right: convertMillimetersToTwip(3),
              },
            });
          });
          return new TableRow({ children: cells });
        });

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          })
        );
      }
    }
    // Horizontal Rule
    else if (tag === 'hr') {
      children.push(
        new Paragraph({
          border: {
            bottom: {
              color: '94A3B8',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 160, after: 160 },
        })
      );
    }
    // Fallback block
    else {
      children.push(
        new Paragraph({
          children: parseTextRuns(el),
          spacing: { after: 120 },
        })
      );
    }
  }

  // Ensure at least one paragraph exists
  if (children.length === 0) {
    children.push(new Paragraph({ text: '' }));
  }

  return children;
}

/**
 * Export HTML string to a standard .docx file and trigger download
 */
export async function exportToDocx(
  title: string,
  htmlContent: string,
  margins: MarginConfig,
  orientation: Orientation
): Promise<void> {
  const parser = new DOMParser();
  const docDom = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const container = docDom.body.firstElementChild as HTMLElement;

  const docxChildren = convertDomToDocxChildren(container);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(margins.top),
              bottom: convertMillimetersToTwip(margins.bottom),
              left: convertMillimetersToTwip(margins.left),
              right: convertMillimetersToTwip(margins.right),
            },
            size: {
              orientation: orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
          },
        },
        children: docxChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = (title.trim() || 'Van_ban').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `${cleanTitle}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger print dialog with exact A4 sheet print styling
 */
export function printDocument(): void {
  window.print();
}
