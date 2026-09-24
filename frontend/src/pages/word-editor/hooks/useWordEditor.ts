import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { FontFamily } from '@tiptap/extension-font-family';

interface UseWordEditorProps {
  initialContent: string;
  onUpdate?: (html: string) => void;
}

export function useWordEditor({ initialContent, onUpdate }: UseWordEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      FontFamily,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'word-editor-content focus:outline-none min-h-[900px] text-slate-800 leading-relaxed',
        spellcheck: 'false',
      },
    },
  });

  const getWordCount = (): { words: number; chars: number } => {
    if (!editor) return { words: 0, chars: 0 };
    const text = editor.getText();
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars };
  };

  const insertTable = (rows: number = 3, cols: number = 3) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  const insertImage = (url: string) => {
    if (!editor || !url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertMergeField = (fieldKey: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` ${fieldKey} `).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  return {
    editor,
    getWordCount,
    insertTable,
    insertImage,
    insertMergeField,
    clearFormatting,
  };
}
