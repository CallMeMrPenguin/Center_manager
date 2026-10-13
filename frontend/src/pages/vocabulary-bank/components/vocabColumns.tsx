import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { DbVocab } from '../../../types';

export function formatVocabWord(vocab: string) {
  if (!vocab) return '-';
  const prefixMatch = vocab.match(/^\(([^)]+)\)\s*(.*)$/);
  let prefix = '';
  let rest = vocab;
  if (prefixMatch) {
    prefix = `(${prefixMatch[1]}) `;
    rest = prefixMatch[2].trim();
  }
  const isCore = rest.startsWith('[') && rest.endsWith(']');
  const isRelated = rest.startsWith('{') && rest.endsWith('}');
  let cleanWord = rest;
  if (isCore || isRelated) cleanWord = rest.slice(1, -1);

  return (
    <div className="flex items-center gap-1.5 flex-wrap font-sans text-xs">
      {prefix && (
        <span className="text-rose-600 font-extrabold italic text-[0.73rem]">{prefix}</span>
      )}
      {isCore ? (
        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold">
          {cleanWord}
        </span>
      ) : isRelated ? (
        <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-600 font-medium">
          {cleanWord}
        </span>
      ) : (
        <span className="text-slate-800 font-semibold">{cleanWord}</span>
      )}
    </div>
  );
}

export function getVocabColumns(onEdit: (vocab: DbVocab) => void): ColumnDef<DbVocab>[] {
  return [
    {
      accessorKey: 'grade',
      header: 'Khối Lớp',
      cell: (info) => <span className="font-bold text-slate-900">Lớp {info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: (info) => <span className="font-bold text-slate-700">Unit {info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'vocabulary',
      header: 'Từ Vựng',
      cell: (info) => formatVocabWord(info.getValue<string>()),
    },
    {
      accessorKey: 'pos',
      header: 'Từ Loại',
      cell: (info) => <span className="text-slate-600 font-mono text-xs">{info.getValue<string>() || '-'}</span>,
    },
    {
      accessorKey: 'ipa',
      header: 'Phiên Âm',
      cell: (info) => <span className="text-slate-500 font-mono text-xs">{info.getValue<string>() || '-'}</span>,
    },
    {
      accessorKey: 'meaning',
      header: 'Nghĩa Tiếng Việt',
      cell: (info) => <span className="text-slate-800 font-medium">{info.getValue<string>()}</span>,
    },
    {
      accessorKey: 'difficulty',
      header: 'Mức Độ',
      cell: (info) => {
        const val = info.getValue<string>();
        return val ? (
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-500/20">
            {val}
          </span>
        ) : <span className="text-slate-400">-</span>;
      },
    },
    {
      accessorKey: 'root_word',
      header: 'Từ Gốc',
      cell: (info) => <span className="text-slate-600 text-xs">{info.getValue<string>() || '-'}</span>,
    },
    {
      id: 'actions',
      header: 'Thao Tác',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
          aria-label="Chỉnh sửa từ vựng"
        >
          <Edit3 size={14} />
        </button>
      ),
    },
  ];
}
