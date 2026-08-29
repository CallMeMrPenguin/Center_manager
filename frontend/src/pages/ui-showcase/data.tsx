import React from 'react';
import { ColumnDef } from '../../components/ui/animated-table';
import { FileTreeNode } from '../../components/ui/file-tree';
import { HoverPreviewItem } from '../../components/ui/hover-preview';

// 1. File Tree Sample Data
export const sampleTreeData: FileTreeNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'button', name: 'Button.tsx', type: 'file' },
          { id: 'input', name: 'Input.tsx', type: 'file' },
          { id: 'calendar', name: 'Calendar.tsx', type: 'file' },
        ],
      },
      { id: 'utils', name: 'utils.ts', type: 'file' },
      { id: 'api', name: 'api.ts', type: 'file' },
    ],
  },
  { id: 'package', name: 'package.json', type: 'file' },
  { id: 'readme', name: 'README.md', type: 'file' },
];

// 2. Hover Preview Data
export const samplePreviewData: Record<string, HoverPreviewItem> = {
  'user-alice': {
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=560&h=320&fit=crop',
    title: 'Alice Johnson',
    subtitle: 'Học sinh lớp 12A1 Chuyên Anh. Đạt giải Nhì học sinh giỏi thành phố.',
    badge: 'Học Sinh Giỏi',
    details: {
      'Điểm TB': '8.8 / 10',
      'Xếp Hạng': 'Top 3 Toàn Khóa',
      'Chuyên Cần': '98%',
      'EMA Level': '8.9',
    },
  },
  'user-bob': {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=560&h=320&fit=crop',
    title: 'Bob Smith',
    subtitle: 'Học sinh lớp 11B2. Tiến bộ vượt bậc trong 4 tuần gần nhất.',
    badge: 'Tiến Bộ Nhanh',
    details: {
      'Điểm TB': '7.6 / 10',
      'Xếp Hạng': 'Hạng 12',
      'Chuyên Cần': '94%',
      'EMA Level': '7.8',
    },
  },
  midjourney: {
    image: 'https://images.unsplash.com/photo-1695144244472-a4543101ef35?w=560&h=320&fit=crop',
    title: 'Midjourney AI',
    subtitle: 'Tạo tác phẩm nghệ thuật AI chất lượng cao với độ chi tiết ấn tượng.',
    badge: 'AI Engine',
  },
  stable: {
    image: 'https://images.unsplash.com/photo-1712002641088-9d76f9080889?w=560&h=320&fit=crop',
    title: 'Stable Diffusion',
    subtitle: 'Mô hình sinh hình ảnh mã nguồn mở linh hoạt và mạnh mẽ.',
    badge: 'Open Source',
  },
};

// 3. Animated Table Sample Data
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  department: string;
  joinDate: string;
}

export const tableSampleData: UserData[] = [
  { id: '1', name: 'Nguyễn Văn An', email: 'an.nv@example.com', role: 'Admin', status: 'active', department: 'Học vụ', joinDate: '2024-01-15' },
  { id: '2', name: 'Trần Thị Bình', email: 'binh.tt@example.com', role: 'Giáo viên', status: 'active', department: 'Toán học', joinDate: '2024-02-20' },
  { id: '3', name: 'Lê Hoàng Cường', email: 'cuong.lh@example.com', role: 'Trợ giảng', status: 'pending', department: 'Vật lý', joinDate: '2024-03-10' },
  { id: '4', name: 'Phạm Minh Đức', email: 'duc.pm@example.com', role: 'Giáo viên', status: 'inactive', department: 'Hóa học', joinDate: '2023-11-05' },
  { id: '5', name: 'Hoàng Thu Giang', email: 'giang.ht@example.com', role: 'Quản trị viên', status: 'active', department: 'Tuyển sinh', joinDate: '2023-08-22' },
];

export const tableColumns: ColumnDef<UserData>[] = [
  {
    id: 'name',
    header: 'Họ và Tên',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black text-xs">
          {row.name.charAt(0)}
        </div>
        <span className="font-bold text-white">{row.name}</span>
      </div>
    ),
  },
  { id: 'email', header: 'Email', accessorKey: 'email', sortable: true },
  { id: 'role', header: 'Vai Trò', accessorKey: 'role', sortable: true },
  { id: 'department', header: 'Phòng Ban', accessorKey: 'department', sortable: true },
  {
    id: 'status',
    header: 'Trạng Thái',
    sortable: true,
    align: 'center',
    cell: (row) => {
      const styles = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        inactive: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      }[row.status];
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-bold text-[10px] ${styles}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-400' : row.status === 'inactive' ? 'bg-rose-400' : 'bg-amber-400'}`} />
          {row.status === 'active' ? 'Hoạt động' : row.status === 'inactive' ? 'Nghỉ' : 'Chờ duyệt'}
        </span>
      );
    },
  },
];
