# Center Manager App — Agent Rules & Global Standards

> **MANDATORY READING**: Read this file completely at the start of every agent session.
> This is the single central source of truth for all coding, architectural, UI/UX, database, and git standards.

---

## 🏗️ 1. Project Overview

**Center Manager App** — A Vietnamese tutoring center management system.
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS v4
- **Backend**: Python (FastAPI) + SQLite
- **Remote**: `https://github.com/CallMeMrPenguin/Center_manager.git` (branch: `main`)

---

## 📏 2. Strict File Size Limit & Modular Architecture Standard

- **Frontend Files**: **Strict Maximum 400 Lines** per file. Any component, page, or view approaching 400 lines MUST be refactored and modularized into subcomponents, dedicated hooks, types, or tab sub-views.
- **Backend Files**: **Strict Maximum 500 Lines** per file. Large routers or service files MUST be partitioned into modular domain routers, services, or utility modules.
- **Strictly No Bloated Monoliths**: 1,000+ line files are strictly forbidden to ensure clean searchability, maintainability, fast code reviews, and minimal merge conflicts.

---

## 📊 3. TanStack Table Standard — MANDATORY FOR ALL TABLES

> **THIS IS A HARD RULE. ANY TABLE IN ANY PAGE OR COMPONENT MUST USE TANSTACK TABLE VIA THE `<DataTable />` WRAPPER. NO EXCEPTIONS.**

### 3.1 — Core Mandate
1. **ALWAYS use `<DataTable />`** from `src/components/DataTable.tsx` for every data table. Never write a raw `<table>` with manual filtering, sorting, or pagination.
2. The `DataTable` component is a **self-contained TanStack Table wrapper** with all 15 features built-in. Pages only define `data` and `columns`; they never manage table state.
3. **Never add manual search state** (e.g. `const [search, setSearch] = useState('')`) in a page that uses `<DataTable />`. TanStack's `globalFilter` handles it internally.
4. **Never add manual pagination state** (e.g. `currentPage`, `pageSize`) in a page that uses `<DataTable />`. TanStack's `getPaginationRowModel()` handles it internally. Default is strictly 20 rows/page.
5. **Never add manual sort state** (e.g. `sortConfig`, `sortField`, `setSortDirection`) in a page that uses `<DataTable />`.
6. **Never add manual column visibility state** in a page. The built-in `ColumnVisibilityDropdown` handles it.

### 3.2 — Quick Usage Pattern
```tsx
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

const columns = useMemo<ColumnDef<Student>[]>(() => [
  {
    accessorKey: 'full_name',
    header: 'Họ và Tên',
    cell: (info) => <span className="font-bold">{info.getValue<string>()}</span>,
  },
  {
    id: 'actions',
    header: 'Thao Tác',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => <ActionButtons row={row.original} />,
  },
], []);

<DataTable<Student>
  data={students}
  columns={columns}
  pageSize={20}
  exportFilename="students_export"
/>
```

---

## 🚀 4. Git Auto Quick-Commit, Version Bump & Push Standard

- **Automatic Sync to Remote Repository**:
  - Remote Origin URL: `https://github.com/CallMeMrPenguin/Center_manager.git` (Branch: `main`).
  - **Mandatory End-of-Task Action**: After making code updates or completing features in any coding session, the agent MUST automatically perform a quick-commit & push to GitHub:
    ```bash
    git add . ; git commit -m "feat/fix: [Brief summary of changes made]" ; git push origin main
    ```
- **Auto Push Update & Version Bump Standard**:
  - Whenever asked to release an update, bump version, or publish changes:
    1. Bump the version string in `VERSION` file (e.g., `1.0.0` → `1.0.1`).
    2. Rebuild the frontend (`npm run build`) and Windows installer (`python installer/build_installer.py`).
    3. Commit and push commits along with git tags:
       ```bash
       git add . ; git commit -m "release: v1.0.1" ; git tag v1.0.1 ; git push origin main --tags
       ```
    4. All installed user app instances will automatically detect the new tag via `updater.py` and update in-place without manual reinstall.

---

## 📐 5. "One Container, One Visual Boundary" UI Standard

- **Strictly No Border-in-Border / Card-in-Card**: Avoid wrapping bordered components (e.g. `<CustomSelect />`, `<CustomDatePicker />`, inputs, metric items) inside another bordered outer wrapper card.
- **Single Visual Boundary**: Every card, section, or toolbar group should have **exactly one clean visual boundary**. Sub-elements should rely on clean layout spacing (`gap-3`), subtle background distinction, or single-line dividers (`divide-x` / `divide-y`) rather than nested wrapper boxes with borders.

---

## 🚫 6. Strictly No Pipe (`|`) or Bullet (`•`) Text Separators

- **No Text Pipes or Bullet Dots**: Bullet dot characters (`•`) and vertical pipes (`|`) MUST NOT be used to separate text items or metadata fields in UI strings.
- **Use Structured Elements**: Data items MUST be separated using clean structured flex badges, subtle typography hierarchy, or clean spacing.

---

## 🎨 7. Custom Dark Theme & Zero-Blur GPU Performance

- **Custom Dark Select Required (`<CustomSelect />`)**: Native HTML `<select>` elements are strictly forbidden. All dropdown selections MUST use `<CustomSelect />` matching the dark indigo space theme (`#0c0f1e` background, `#212c4b` border, `#5c36f5` highlight).
- **Custom Dark DatePicker Required (`<CustomDatePicker />`)**: Native browser `<input type="date">` elements are strictly forbidden. All date selections MUST use `<CustomDatePicker />`.
- **Zero-Blur GPU Performance**: CSS blur filters (`backdrop-blur-*`, `blur-*`) are strictly forbidden on scrollable lists, review cards, and large data tables. All elements MUST use crisp, solid high-contrast dark theme surfaces (`#080b14`, `#0c0f1e`, `#0d1120`, `#121626`).
- **Solid Dark Backdrop Overlays**: Modals and context menus MUST NOT use `backdrop-blur-*`. All modal backdrops MUST use solid dark overlays (`bg-black/85`).
- **Pure White Icons**: No icon or SVG may use black or near-black colors (`text-black`, `text-slate-900`). Calendar picker icons enforce pure white (`filter: invert(1) brightness(2) !important`).
- **Strictly No Injected Emojis**: Emojis MUST NOT be injected by serializers, formatters, parsers, or UI components unless present in raw source content.
- **Single Decimal Truncation (`format1Dec` / `trunc1Dec`)**: All calculated scores, session averages, academic predictions, quiz results, and Excel/PDF exports MUST be formatted/truncated to strictly **1 figure after the decimal point (`.`) without rounding up or down** (e.g. `6.21` -> `6.2`, `6.28` -> `6.2`, `8.86` -> `8.8`).
- **Data Integrity**: Unentered or missing grades must NEVER be recorded as numeric `0` or `0.0`. Missing grades are recorded as `NULL`.
- **Single Pen Action Button**: Cards/rows MUST NOT display a separate Trash Bin icon alongside an Edit Pen icon. Cards/rows feature a single clean Pen action button (`<Edit3 />`). Deletion is provided as a red Delete button inside the Edit modal popup.

---

## 💎 8. UI/UX Pro Max — Design Intelligence & Quality Guidelines

*Follow this priority 1→10 checklist for all UI/UX design decisions, component building, and reviews:*

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | **Accessibility** | CRITICAL | `ux` | Contrast ≥ 4.5:1, Alt text, Keyboard navigation, Aria-labels | Removing focus rings, Icon-only buttons without accessible labels |
| 2 | **Touch & Interaction** | CRITICAL | `ux` | Min touch target 44×44px, 8px+ spacing, Immediate loading feedback | Reliance on hover only, Instant 0ms state jumps |
| 3 | **Performance** | HIGH | `ux` | Virtualization for 500+ rows, Zero layout thrashing, No CSS blur GPU bottlenecks | Massive DOM trees, Layout shifts, Unmemoized table rows |
| 4 | **Style Consistency** | HIGH | `style` | Cohesive dark indigo palette, Crisp borders, Single visual boundary | Card-in-card nesting, Border-in-border, Emojis as icons |
| 5 | **Layout & Responsive** | HIGH | `ux` | Flex/grid wrap, No horizontal page scroll, Collapsing labels on mobile | Fixed px container widths, Horizontal overflow |
| 6 | **Typography & Color** | MEDIUM | `typography` | High-contrast text, Semantic color tokens, Inter/sans font stack | Gray-on-gray unreadable text, Text < 12px for body |
| 7 | **Animation** | MEDIUM | `animation` | Smooth sequential reveal (0.35s ease-out, translateY(12px)->0), Staggered order | Jarring 95px jumps, Out-of-order flashing cards |
| 8 | **Forms & Feedback** | MEDIUM | `ux` | Clear field labels, Inline validation near fields, Toast notifications | Errors shown only at top, Silent failure states |
| 9 | **Navigation Patterns** | HIGH | `ux` | Predictable sliding tab pill indicators, Breadcrumb trails | Overloaded navigation, Inconsistent active states |
| 10 | **Charts & Data** | LOW | `chart` | Tooltips on hover with exact values, Smooth SVG center scale origins, Legends | Color-only meaning, Square clipped glow filters |

---

## 🚫 9. Forbidden Patterns Summary

| Forbidden | Required Instead |
|---|---|
| Raw `<table>` with manual JS filtering | `<DataTable data={...} columns={...} />` |
| `useState` for search/sort/page in a page with DataTable | Remove it — DataTable handles internally |
| `useReactTable` called directly in a page | Only allowed inside `DataTable.tsx` component |
| Bloated files (>400 lines frontend, >500 lines backend) | Modularize into subcomponents, hooks & tabs |
| `backdrop-blur-*` CSS classes | Solid dark backgrounds only (`#080b14`, `#0c0f1e`, `#121626`) |
| Native `<select>` dropdowns | `<CustomSelect />` component |
| Native `<input type="date">` | `<CustomDatePicker />` component |
| Separate trash bin icon on cards | Single edit pen + delete inside modal |
| Pipe `|` or Bullet `•` text separators | Structured flex badges, typography & spacing |
| Card-in-card / Border-in-border | 'One container, one visual boundary' & single dividers |
| Grade `0` / `0.0` for unset scores | `NULL` for missing grades |
| Text / numbers with 2+ decimal places | 1 decimal truncation via `format1Dec` / `trunc1Dec` |

---

## 📁 10. Key Files Reference

| File | Purpose |
|---|---|
| `frontend/src/components/DataTable.tsx` | **Shared TanStack Table wrapper — USE THIS FOR ALL TABLES** |
| `frontend/src/components/CustomSelect.tsx` | Custom dark theme dropdown |
| `frontend/src/components/CustomDatePicker.tsx` | Custom dark theme date picker |
| `frontend/src/components/Toast.tsx` | Toast notifications |
| `frontend/src/api.ts` | All API calls |
| `frontend/src/pages/` | Page components (teachers, students, classes, courses, reports, schedule) |
| `.agents/AGENTS.md` | **Central global rules & coding standards (this file)** |
