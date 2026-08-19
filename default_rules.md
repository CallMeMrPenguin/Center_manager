# Center Manager App — Development & Coding Standards

## 📏 1. Strict File Size Limit & Modular Architecture Standard
- **Frontend Files**: **Strict Maximum 400 Lines** per file. Any component, page, or view approaching 400 lines MUST be refactored and modularized into subcomponents, dedicated hooks, types, or tab sub-views.
- **Backend Files**: **Strict Maximum 500 Lines** per file. Large routers or service files MUST be partitioned into modular domain routers, services, or utility modules.
- **Strictly No Bloated Monoliths**: 1,000+ line files are strictly forbidden to ensure clean searchability, maintainability, fast code reviews, and minimal merge conflicts.

## 📊 2. TanStack Table Standard — Mandatory For All Tables
- All tables MUST use the shared `<DataTable />` wrapper from `src/components/DataTable.tsx`.
- Never use raw HTML `<table>` or custom pagination/sorting states on the page level.
- Default 20 rows/page. No row-count dropdowns.

## 🚀 3. Git Auto Quick-Commit, Version Bump & Push Standard
- After making code updates, automatically commit & push to GitHub:
  ```bash
  git add . ; git commit -m "feat/fix: [Brief summary]" ; git push origin main
  ```
- When releasing an update or bumping version:
  ```bash
  git add . ; git commit -m "release: vX.Y.Z" ; git tag vX.Y.Z ; git push origin main --tags
  ```

## 🎨 4. Custom Dark Theme & Zero-Blur GPU Performance
- All selects MUST use `<CustomSelect />`. Native HTML `<select>` is strictly forbidden.
- All date pickers MUST use `<CustomDatePicker />`. Native `<input type="date">` is forbidden.
- No CSS blur effects (`backdrop-blur-*`). Use crisp, solid high-contrast dark theme surfaces (`#080b14`, `#0d1120`, `#121626`, `#0e1222`).
- Emojis MUST NOT be injected in UI elements or serializers.
- All calculated grades and scores MUST be truncated to strictly 1 decimal place using `format1Dec` or `trunc1Dec` without rounding up/down.
- Missing grades recorded as `NULL`, never numeric `0` or `0.0`.

## 🚫 5. Strictly No Pipe (`|`) or Bullet (`•`) Text Separators
- Do NOT use vertical pipe characters (`|`) or bullet dots (`•`) to separate text or metadata.
- Use structured flex badges, subtle typography, or clean whitespace layout instead.

## 📐 6. "One Container, One Visual Boundary" UI Standard
- **Strictly No Border-in-Border / Card-in-Card**: Avoid wrapping bordered components (e.g. `<CustomSelect />`, inputs, metric items) inside another bordered outer wrapper card.
- Every section or group should have **one visual boundary**. Inner sub-items must use clean flex/grid layout with spacing or single-line dividers (`divide-x` / `divide-y`) rather than nested cards with double borders.
