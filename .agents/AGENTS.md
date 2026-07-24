# Center Manager App — Agent Rules

> **MANDATORY READING**: Read this file completely at the start of every agent session.
> All rules in `default_rules.md` also apply. See: [default_rules.md](file:///c:/Users/ACER/Desktop/Center_Manager_App/default_rules.md)

---

## 🏗️ Project Overview

**Center Manager App** — A Vietnamese tutoring center management system.
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS v4
- **Backend**: Python (FastAPI)
- **Remote**: `https://github.com/CallMeMrPenguin/Center_manager.git` (branch: `main`)

---

## 📊 RULE: ALL TABLES MUST USE TANSTACK TABLE — NO EXCEPTIONS

This is the single most important technical rule for this project.

### Every table on every page MUST:

1. Use the shared `<DataTable />` component from `src/components/DataTable.tsx`
2. Never implement manual filtering, sorting, pagination, or column visibility
3. Define columns as `useMemo<ColumnDef<T>[]>(() => [...], [deps])`
4. Pass **raw, unfiltered, unsorted, unpaged** data directly to `<DataTable />`

### Quick Usage Pattern:

```tsx
import { DataTable } from '../components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

// 1. Define columns
const columns = useMemo<ColumnDef<MyType>[]>(() => [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'status', header: 'Trạng Thái' },
  {
    id: 'actions',
    header: 'Thao Tác',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => <ActionButtons data={row.original} />,
  },
], []);

// 2. Use DataTable — it handles search, sort, pagination, export, etc.
<DataTable
  data={myData}
  columns={columns}
  pageSize={20}
  exportFilename="my_data_export"
/>
```

### DataTable Features (all built-in, zero configuration needed):
- ✨ Smooth row hover + alternating row colors
- 🎨 Rounded corners, custom dark theme
- 📌 Sticky header + optional sticky first column (`stickyFirstColumn`)
- ↔️ Drag-to-resize columns
- ↕️ Drag-and-drop column reorder (`@dnd-kit`)
- 👁️ Show/hide columns dropdown
- 🔍 Global search input
- 🎯 Multi-column sorting (click headers)
- 📄 Pagination (20/page default, page pills, page-size selector)
- ⚡ Virtual scrolling (auto-on when `data.length > 500`)
- 📤 Excel + PDF export (`xlsx` + `jspdf-autotable`)
- ☑️ Row selection with indeterminate checkboxes
- 📱 Responsive layout

### Full `DataTableProps<TData>` API:
See **Rule 17.3** in [default_rules.md](file:///c:/Users/ACER/Desktop/Center_Manager_App/default_rules.md) for the complete prop reference.

### Required packages (must be installed):
```bash
npm install @tanstack/react-table @tanstack/react-virtual @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities xlsx jspdf jspdf-autotable
```

---

## 🚀 RULE: Auto Git Commit After Every Task

After ANY code change, ALWAYS run:
```bash
git add . && git commit -m "feat/fix: [brief summary]" && git push origin main
```

---

## 🚫 FORBIDDEN PATTERNS

| Forbidden | Required Instead |
|---|---|
| Raw `<table>` with manual JS filtering | `<DataTable data={...} columns={...} />` |
| `useState` for search/sort/page in a page with DataTable | Remove it — DataTable handles internally |
| `useReactTable` called directly in a page | Only allowed inside `DataTable.tsx` component |
| `backdrop-blur-*` CSS classes | Solid dark backgrounds only |
| Native `<select>` dropdowns | `<CustomSelect />` component |
| Native `<input type="date">` | `<CustomDatePicker />` component |
| Separate trash bin icon on cards | Single edit pen + delete inside modal |
| Bullet dot `•` separators | Pipe `|` separators or flex badges |
| Grade `0` / `0.0` for unset scores | `NULL` for missing grades |

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `frontend/src/components/DataTable.tsx` | **Shared TanStack Table wrapper — USE THIS FOR ALL TABLES** |
| `frontend/src/components/CustomSelect.tsx` | Custom dark theme dropdown |
| `frontend/src/components/CustomDatePicker.tsx` | Custom dark theme date picker |
| `frontend/src/components/Toast.tsx` | Toast notifications |
| `frontend/src/api.ts` | All API calls |
| `frontend/src/pages/` | Page components (teachers, students, classes, courses, reports, schedule) |
| `default_rules.md` | Full coding rules (read before every task) |
