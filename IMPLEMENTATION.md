# Implementation Plan — Student Pairing & Seating Engine

> **Last updated:** 2026-07-21
> Work through sections in order. Each section is self-contained and can be merged independently.

---

## Bug Fix — Vietnamese IME Input in pywebview

### Root Cause

The app runs inside a **pywebview EdgeChromium** (WebView2) window.
On Windows, pywebview's `edgechromium` GUI mode intercepts raw keyboard events at the Win32 message-loop level **before** the WebView2 process can hand them off to the Chromium input pipeline.

Vietnamese IME (Unikey, EVKey, etc.) works by composing multi-keystroke sequences at the OS input method layer before dispatching the final Unicode character. The default `webview.start(gui='edgechromium')` blocks this composition from reaching React `<input>` / `<textarea>` elements.

### Fix

Open `main.py` and change the webview launch call:

`python
# BEFORE
webview.start(gui='edgechromium')

# AFTER
webview.start(
    gui='edgechromium',
    private_mode=False,
    http_server=True,   # enables full WebView2 IME pipeline
)
`

If the above is still insufficient (depends on pywebview version), add this **before** `webview.create_window(...)`:

`python
import os
os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = '--enable-features=msEdgeIMEComposition'
`

### Files to Touch

| File | Change |
|------|--------|
| `main.py` | Add `private_mode=False, http_server=True` to `webview.start(...)` |

---

## Feature — Student Pairing & Seating Engine

### Overview

| System | Algorithm | Output |
|--------|-----------|--------|
| Swap Test Generator | **Blossom Matching** (Edmonds) | 1-to-1 student pairs for paper exchange |
| Seat Mix Generator | **Genetic Algorithm** | Full classroom seating layout |

---

## Section 1 — Database Schema

Add all tables inside `init_db()` in `backend/database/db_manager.py`.

### 1.1 Friend Groups

`sql
CREATE TABLE IF NOT EXISTS friend_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id    INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    group_name  TEXT NOT NULL,
    color_hex   TEXT DEFAULT '#6366F1',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friend_group_members (
    group_id    INTEGER REFERENCES friend_groups(id) ON DELETE CASCADE,
    student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_id    INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);
`

### 1.2 Conflict Relationships

`sql
CREATE TABLE IF NOT EXISTS conflict_relationships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id    INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    student_id1 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    student_id2 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, student_id1, student_id2)
);
-- Always store canonical: student_id1 < student_id2
`

### 1.3 Trusted Swap Relationships

`sql
CREATE TABLE IF NOT EXISTS trusted_swap_relationships (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id    INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    student_id1 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    student_id2 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, student_id1, student_id2)
);
`

### 1.4 Extend class_seating Table

`sql
-- Use ALTER TABLE with try/except (pattern already used in codebase)
ALTER TABLE class_seating ADD COLUMN rows INTEGER DEFAULT 4;
ALTER TABLE class_seating ADD COLUMN cols INTEGER DEFAULT 6;
ALTER TABLE class_seating ADD COLUMN snapshot_name TEXT DEFAULT 'Ban chinh';
`

### DB Helper Signatures

`
# friend_groups
get_friend_groups(class_id) -> List[Dict]
create_friend_group(class_id, group_name, color_hex) -> int
delete_friend_group(group_id)
add_member_to_group(group_id, student_id, class_id)
remove_member_from_group(class_id, student_id)
get_student_group(class_id, student_id) -> Dict | None

# conflicts
get_conflict_pairs(class_id) -> List[Dict]
add_conflict_pair(class_id, s1, s2) -> int
remove_conflict_pair(conflict_id)

# trusted swaps
get_trusted_swap_pairs(class_id) -> List[Dict]
add_trusted_swap_pair(class_id, s1, s2) -> int
remove_trusted_swap_pair(swap_id)
`

---

## Section 2 — Seating Engine Rewrite

File: `backend/services/seating_engine.py`

### 2.1 Data Structures

`python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Student:
    id: int
    name: str
    gender: str              # 'Nam' | 'Nu' | 'Khac'
    group_id: Optional[int]  # FriendGroup ID; None = no group
    is_absent: bool = False

@dataclass
class RelationshipData:
    conflict_pairs: set = field(default_factory=set)       # frozenset pairs
    trusted_swap_pairs: set = field(default_factory=set)   # frozenset pairs

    def is_conflict(self, a_id: int, b_id: int) -> bool:
        return frozenset((a_id, b_id)) in self.conflict_pairs

    def is_trusted_swap(self, a_id: int, b_id: int) -> bool:
        return frozenset((a_id, b_id)) in self.trusted_swap_pairs

    def same_group(self, a: Student, b: Student) -> bool:
        return (a.group_id is not None
                and b.group_id is not None
                and a.group_id == b.group_id)
`

### 2.2 Compatibility Helpers

`python
def can_swap(a, b, rel):
    if a.id == b.id: return False
    if rel.is_conflict(a.id, b.id): return False
    if rel.same_group(a, b): return False
    if a.gender == b.gender:
        return rel.is_trusted_swap(a.id, b.id)
    return True

def can_sit_adjacent(a, b, rel):
    if rel.is_conflict(a.id, b.id): return False
    if rel.same_group(a, b): return False
    return True
`

---

## Section 3 — Blossom Matching (Swap Test)

Uses **NetworkX** `max_weight_matching(G, maxcardinality=True)`.
NetworkX is already installed in the environment.

### Algorithm

1. Build weighted graph G (every present student = node)
2. For each compatible pair `can_swap(a, b)` add edge:
   - Base weight: 1
   - +2 if different gender (preferred)
   - +1 if different friend group (preferred)
3. Run `nx.max_weight_matching(G, maxcardinality=True)`
4. Return pairs + explain any unmatched students

### API Endpoint

`
POST /api/classes/{class_id}/seating/blossom-swap
Body:    { "absent_student_ids": [], "seed": null }
Returns: { "pairs": [...], "unmatched": [...] }
`

---

## Section 4 — Genetic Algorithm (Seat Mix)

### Chromosome Representation

A chromosome is a flat list of student IDs (+ `None` padding) filling seats row-by-row.

`
Chromosome: [s5, s2, None, s8, s1, ...]
Seats:       [R0C0, R0C1, R0C2, R1C0, ...]
`

### Fitness Function

| Condition | Score |
|-----------|-------|
| Conflict pair adjacent OR in same 2x2 block | -100 |
| Same friend group adjacent OR in same 2x2 block | -100 |
| Cross-gender right neighbor | +10 |

### GA Loop

1. Random initial population (`population_size` permutations)
2. Each generation: score all, track best, early-exit if 40 stale generations
3. Select top 50%, generate children via Order Crossover (OX)
4. Mutate children: swap 2 random positions at `mutation_rate`
5. Return best chromosome converted to layout JSON

### API Endpoint

`
POST /api/classes/{class_id}/seating/genetic-mix
Body: {
    "rows": 4, "cols": 6,
    "absent_student_ids": [],
    "population_size": 80,
    "max_generations": 300,
    "mutation_rate": 0.15,
    "seed": null
}
Returns: { "layout": [...], "fitness_score": float, "generations_run": int }
`

---

## Section 5 — REST API Endpoints

All new — add to `backend/main.py`:

`
# Friend Groups
GET    /api/classes/{id}/friend-groups
POST   /api/classes/{id}/friend-groups                    { group_name, color_hex }
DELETE /api/classes/{id}/friend-groups/{gid}
POST   /api/classes/{id}/friend-groups/{gid}/members      { student_id }
DELETE /api/classes/{id}/friend-groups/{gid}/members/{student_id}

# Conflicts
GET    /api/classes/{id}/conflicts
POST   /api/classes/{id}/conflicts                        { student_id1, student_id2 }
DELETE /api/classes/{id}/conflicts/{conflict_id}

# Trusted Swaps
GET    /api/classes/{id}/trusted-swaps
POST   /api/classes/{id}/trusted-swaps                    { student_id1, student_id2 }
DELETE /api/classes/{id}/trusted-swaps/{swap_id}

# Algorithms
POST   /api/classes/{id}/seating/blossom-swap
POST   /api/classes/{id}/seating/genetic-mix
`

---

## Section 6 — Frontend

### 6.1 New Sub-Tab: Nhom Ban & Xung Dot

Add as the 3rd tab inside the Class Detail panel.

Layout:

`
[Diem Danh & Diem]  [So Do Lop]  [Nhom Ban & Xung Dot]

NHOM BAN BE                                   [+ Tao Nhom]
[Dot mau] Nhom A   Alice  Beth  Carol  [+ Them][Xoa nhom]
[Dot mau] Nhom B   Eric   Frank        [+ Them][Xoa nhom]

XUNG DOT CA NHAN                              [+ Them]
Alice <-> Henry                                       [x]
Beth  <-> Ivan                                        [x]

DOI BAI TIN CAY                               [+ Them]
David <-> Eric                                        [x]
`

Student pickers are **searchable dropdowns**.

### 6.2 SeatingTab Toolbar (updated)

`
Old: [+ Col] [- Col]  [Tron ngau nhien]  [Gan cham bai]  [Luu]
New: [+ Col] [- Col]  [Tron Ngau Nhien]  [Tron Thong Minh]  [Doi Bai Blossom]  [Luu]
`

**Tron Thong Minh** opens a settings popover (Rows / Cols / Max Gen / Population Size) then calls `/genetic-mix`.
**Doi Bai Blossom** calls `/blossom-swap` and shows the BlossomResultModal.

### 6.3 Seat Chip Indicators

- **Friend Group color dot** on each chip
- **Red glow** — conflict pair with desk-mate
- **Orange glow** — same friend group as desk-mate

### 6.4 Blossom Result Modal

`
PHAN CONG DOI BAI — BLOSSOM MATCHING
[v] Alice (Nhom A)  <->  Eric  (Nhom B)
[v] Beth  (Nhom A)  <->  Frank (Nhom B)
[!] Sam   <->  Tom   [Cung gioi, da tin cay]
----
Khong ghep duoc:
[x] Henry — Khong co hoc sinh tuong thich
                                    [Dong]
`

---

## Section 7 — Frontend File Map

`
frontend/src/pages/
  classes.tsx                   (modify — add 3rd sub-tab)

frontend/src/components/seating/
  RelationshipsTab.tsx          (NEW)
  BlossomResultModal.tsx        (NEW)
  FriendGroupEditor.tsx         (NEW)
  PairPicker.tsx                (NEW — searchable 2-student picker)

frontend/src/api.ts             (add new endpoint wrappers)
`

---

## Execution Order

`
Bug Fix:
  1.  Fix Vietnamese IME — main.py webview.start()

Database:
  2.  Add friend_groups table
  3.  Add friend_group_members table
  4.  Add conflict_relationships table
  5.  Add trusted_swap_relationships table
  6.  ALTER TABLE class_seating: rows, cols, snapshot_name
  7.  Write all DB helper functions

Backend:
  8.  Rewrite seating_engine.py — Student, RelationshipData dataclasses
  9.  Add can_swap() and can_sit_adjacent()
  10. Implement generate_swap_pairs() — Blossom via NetworkX
  11. Implement genetic_seat_mix() — GA with OX crossover
  12. Add /friend-groups REST endpoints
  13. Add /conflicts REST endpoints
  14. Add /trusted-swaps REST endpoints
  15. Add /blossom-swap endpoint
  16. Add /genetic-mix endpoint

Frontend:
  17. Build RelationshipsTab.tsx
  18. Build FriendGroupEditor.tsx
  19. Build PairPicker.tsx
  20. Build BlossomResultModal.tsx
  21. Update SeatingTab toolbar buttons
  22. Update seat chips (group color dot + conflict glow)
  23. Wire 3rd sub-tab into classes.tsx
  24. Update api.ts

Verification:
  25. Confirm Vietnamese IME works
  26. Test Friend Group CRUD + member add/remove
  27. Test Conflict + Trusted Swap CRUD
  28. Test Blossom: same-gender class, odd count, heavy conflicts
  29. Test GA: no constraints, heavy constraints, absent students
`

---

## Open Questions

| # | Question | Default Answer |
|---|----------|----------------|
| Q1 | Can a student belong to more than one Friend Group per class? | No — max 1 group per student |
| Q2 | Does Trusted Swap also bypass the seating adjacency rule? | No — only bypasses same-gender rule for paper swap |
| Q3 | Odd number of students: should the leftover be flagged or auto-assigned self-check? | Flagged as unmatched with explanation |
| Q4 | Should GA soft-constraint weights be configurable via UI sliders? | No for v1 — fixed weights, sliders in v2 |
| Q5 | Multiple named seating snapshots per class? | No — one snapshot per class |
| Q6 | Should Blossom result be saveable to DB? | No — generated on demand only |
| Q7 | Gender 'Khac': which bucket for same-gender restriction? | Own bucket — can only swap with another 'Khac' unless trusted |
