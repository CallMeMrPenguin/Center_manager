import { ColumnDef } from '@tanstack/react-table';
import { Edit3 } from 'lucide-react';
import { DbQuestion } from '../../../types';
import { TYPE_MAP } from '../constants';

export function getQuestionColumns(onEdit: (q: DbQuestion) => void): ColumnDef<DbQuestion>[] {
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
      accessorKey: 't',
      header: 'Dạng Bài',
      cell: (info) => {
        const val = info.getValue<string>();
        return (
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            {TYPE_MAP[val] || val || 'Khác'}
          </span>
        );
      },
    },
    {
      accessorKey: 'x',
      header: 'Nội Dung Câu Hỏi',
      cell: (info) => (
        <span className="font-medium text-slate-800 line-clamp-2 max-w-md block" title={info.getValue<string>()}>
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'o',
      header: 'Tùy Chọn',
      enableSorting: false,
      cell: (info) => {
        const opts = info.getValue<string[]>() || [];
        if (opts.length === 0) return <span className="text-slate-400">-</span>;
        return (
          <div className="flex flex-col gap-0.5 max-w-xs text-xs text-slate-600">
            {opts.map((opt, idx) => (
              <span key={idx} className="truncate">
                <strong className="text-blue-600">{String.fromCharCode(65 + idx)}.</strong> {opt}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'a',
      header: 'Đáp Án',
      cell: (info) => (
        <span className="font-black text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {info.getValue<string>() || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Độ Khó',
      cell: (info) => {
        const val = info.getValue<string>() || 'NHẬN BIẾT';
        const color =
          val === 'VẬN DỤNG'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : val === 'THÔNG HIỂU'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${color}`}>
            {val}
          </span>
        );
      },
    },
    {
      accessorKey: 'frequency',
      header: 'Tần Suất',
      cell: (info) => <span className="text-slate-600 font-mono text-xs">{info.getValue<string>() || '0'}</span>,
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
          aria-label="Chỉnh sửa câu hỏi"
        >
          <Edit3 size={14} />
        </button>
      ),
    },
  ];
}
