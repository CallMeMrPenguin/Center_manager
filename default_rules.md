# Center Manager App - Default Coding & UI Rules

The following mandatory rules MUST be strictly followed across all features, tables, search indices, UI components, and git workflows in this repository:

---

## 🚀 1. Git Auto Quick-Commit & Push Standard
- **Automatic Sync to Remote Repository**:
  - Remote Origin URL: `https://github.com/CallMeMrPenguin/Center_manager.git` (Branch: `main`).
  - **Mandatory End-of-Task Action**: After making code updates or completing features in any coding session, the agent MUST automatically perform a quick-commit & push to GitHub:
    ```bash
    git add .; git commit -m "feat/fix: [Brief summary of changes made]"; git push origin main
    ```

---

## 📋 2. Table Pagination & Sorting Standards
- **Strict 20 Rows / Page**: Every table in the application MUST stick to **20 rows per page** by default.
- **No Row-Count Dropdowns**: Selection dropdowns allowing row-count changing are strictly forbidden.
- **Pagination Controls**: Tables exceeding 20 rows must feature standard `Trước`, `Trang X / Y`, `Sau` pagination controls.

---

## 🔍 3. Table Column Heading Filter Pattern (Ngân Hàng Câu Hỏi Standard)
Every data table MUST feature a filter icon next to each column title in the table header (`<th>`), working identically to the **Ngân Hàng Câu Hỏi** column filter system:

### ⚙️ How Column Heading Filters Work:
1. **Filter Icon Trigger**: Next to each heading text, render a small `Filter` icon. If a column has an active filter or sort applied, the filter icon highlights in active blue (`text-blue-400 bg-blue-500/10`).
2. **Interactive Filter Popover**:
   - Clicking the filter icon opens a floating popover card (`filter-dropdown-menu z-50`).
   - **Title Bar**: Shows `Lọc: [Tên Cột]` with a close (`X`) button.
   - **Sort Buttons**: Includes `Sắp xếp Tăng dần (A-Z)` and `Sắp xếp Giảm dần (Z-A)` options.
   - **Search Input**: Includes a search input to quickly filter unique column values.
   - **Value List Checkboxes**: Renders a scrollable list of unique values extracted from table records, allowing multi-select checking.
   - **Clear Button**: Includes a `Xóa bộ lọc cột` button to reset that column's filter.
3. **Optimized Performance**: Unique column values MUST be cached with `useMemo` / `useCallback` to ensure instantaneous filtering with zero UI lag across thousands of records.

---

## 🔍 4. Search & Index Filtering
- **Case-Insensitive Search**: All search queries and index filters MUST be case-insensitive (e.g. using `.toLowerCase().trim()`). Capitalization must never prevent a search match.
- **Live Filtering**: Tables must provide responsive live-search filtering for student names, nicknames, class names, or grades.

---

## 📈 5. Graph & Chart Visual Standards
- **Liquid Circular Glow**: SVG data point glow filters MUST use expansive filter bounds (`x="-100%" y="-100%" width="300%" height="300%"`) or SVG radial gradients so that point glows are perfectly circular with ZERO clipped square edges.
- **SVG Circle Scale Center Origin**: Any SVG data point `<circle>` with hover scaling MUST specify `style={{ transformBox: 'fill-box', transformOrigin: 'center' }}` so hover scaling expands symmetrically from the dot's exact center rather than jumping to the top-left origin (0,0).
- **Data Point Hover Values**: Hovering over any data point on line/progress charts MUST render an interactive tooltip card displaying the exact numerical score values (`Check 1`, `Check 2`, `Homework`).
- **Generous Vertical Spacing**: Progress charts must maintain generous height (min 560px) to provide clear vertical separation between score grid lines.

---

## 📅 6. Date Picker & Calendar Styling
- **Dark Theme Calendar**: Any `<input type="date">` or calendar picker MUST match the application's dark theme (`color-scheme: dark !important`).
- **White Calendar Icon**: The calendar picker icon (`::-webkit-calendar-picker-indicator`) MUST match the text color (pure white `#ffffff` with `filter: invert(1) brightness(2) !important`).

---

## 🎨 7. Segmented Control UI & Sliding Indicator Standard
- **Unified Summary Card Aesthetics**: All KPI summary cards must use glowing glassmorphic backdrops with curated gradient glow borders (`.kpi-card-blue`, `.kpi-card-purple`, `.kpi-card-green`, `.kpi-card-amber`).
- **Sliding Pill Indicator Segmented Control**:
  All Segmented Control option groups (e.g. `Điểm Danh & Điểm / Sơ Đồ Lớp / Nhóm Bạn & Xung Đột`, `Lịch Tháng / Lịch Tuần / Danh Sách`, `1 Tháng / 2 Tháng / 3 Tháng / Tất Cả`) MUST implement an absolute sliding indicator pill backdrop (matching the `FlowTab.tsx` reference standard):
  1. **Outer Container**: `relative flex bg-[#0d1018] p-1 rounded-xl border border-white/10 text-xs shrink-0 font-bold select-none`.
  2. **Sliding Indicator Backdrop**:
     - Class: `absolute top-1 bottom-1 rounded-lg bg-[#5c36f5] shadow-[0_0_14px_rgba(92,54,245,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none`
     - Inline style for smooth physical sliding animation:
       - `left`: `calc( (100% / N) * index + 1px )` (or `4px` for index 0).
       - `width`: `calc( (100% / N) - 4px )`.
  3. **Option Buttons**: `flex-1 relative z-10 py-1 text-center transition-colors cursor-pointer`. Text transitions cleanly: `active ? 'text-white font-black' : 'text-slate-400 hover:text-white'`.

---

## 🚫 8. Data Integrity: No Grade 0 Defaults
- **No Grade 0 Entries**: Unentered or missing grades must NEVER be recorded as numeric `0` or `0.0`. Missing grades are recorded as `NULL` so they do not artificially drag down student averages.

---

## ⚡ 9. Zero-Blur GPU Performance Standard
- **No CSS Blur Effects (`backdrop-blur` / `blur-*`)**: CSS blur filters create severe GPU rendering and compositing bottlenecks on scrollable lists, review cards, and large data tables. All elements MUST use crisp, solid high-contrast dark theme surfaces (`bg-[#0c0f1d]`, `bg-[#121626]`, `bg-[#0d1018]`) without any `backdrop-blur` or `blur-*` classes.

---

## 🚀 10. High-Performance Table & List Rendering Rule
- **High-Performance Component Memoization**: All table rows (`QuestionTableRow`, `VocabTableRow`, `StudentTableRow`) and review card items MUST be extracted into standalone `React.memo()` components with pre-memoized text parsers (`useMemo`) to prevent unnecessary row re-renders on hover, checkbox selection, or filter updates.

