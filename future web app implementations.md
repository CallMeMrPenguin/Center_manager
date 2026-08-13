# Future Web App Implementation Plan

## Architecture Overview

```
GitHub (main branch)
 ├── /frontend   →   Vercel          (React + Vite, free)
 └── /backend    →   Vercel          (FastAPI Python serverless, free)
                         ↕
                     Supabase         (PostgreSQL, free tier)

Your PC (local only, never deployed)
 └── TEST_FORMATTER/  (file conversion, PDF/Word generation)
      └── reads directly from Supabase if question/vocab data needed
```

### Why Vercel for both frontend AND backend?

Since all heavy file processing (PDF generation, Word doc compilation, cleanup
jobs) stays local, the deployed backend is pure CRUD — simple read/write
requests to the database. Every request completes in well under Vercel's 10s
function timeout. No Render spin-down problem, no UptimeRobot needed.

---

## Hosting Services

| Layer | Service | Cost | Notes |
|---|---|---|---|
| Frontend | Vercel | Free | Auto-deploys from GitHub on push |
| Backend | Vercel | Free | Python serverless — fine for CRUD-only routes |
| Database | Supabase | Free | 500MB DB + 1GB file storage |

---

---

## Database Plan — Supabase PostgreSQL

**All tables go into one single Supabase project / one database.**
Do NOT split into multiple databases — foreign keys and JOINs won't work across DBs.

### Tables to migrate to Supabase (web-accessible)
- `students`
- `teachers`
- `classes`
- `courses`
- `schedule`
- `attendance`
- `grades`
- `reports` (any derived report tables)

### Tables to keep LOCAL only (SQLite on your PC)
- `question_bank`
- `vocabulary`
- Any formatter-related tables

### Migration steps
1. Export current SQLite schema → convert to PostgreSQL syntax
2. Swap `sqlite3` → `psycopg2` or `asyncpg` in `backend/database/db_manager.py`
3. Update connection string to use Supabase DATABASE_URL
4. Test all CRUD endpoints

---

## Customizable Grade Proportions (Score Weighting)

### How "Điểm Đánh Giá" is calculated right now
Currently, the academic score ("Điểm Đánh Giá") and predictions in `db_manager.py` & `reports.tsx` use fixed weighted averages:
- **Homework (BTVN)**: `10%` (`0.10`)
- **Check 1**: `35%` (`0.35`)
- **Check 2**: `55%` (`0.55`)

Formula:
$$\text{Academic Score} = \frac{\text{HW} \times 0.10 + \text{Check 1} \times 0.35 + \text{Check 2} \times 0.55}{0.10 + 0.35 + 0.55}$$

*(If a student is missing one grade component, the missing weight is excluded from the denominator so missing grades do not drag down averages to 0).*

### Planned Feature: Customizable Proportions / Weights
To allow manual adjustments per class or system-wide (e.g. including **Speaking / Speaking Portion**, **Check 1**, **Check 2**, **Homework**):

1. **Configurable Settings in `config.json` / Database**:
   ```json
   {
     "grade_weights": {
       "homework": 0.10,
       "check_1": 0.35,
       "check_2": 0.55,
       "speaking": 0.00
     }
   }
   ```
2. **Settings UI Component**:
   - Provide a visual slider / percentage input group under Center Settings where admins can set percentages (must sum to 100%).
   - Support custom categories like `Speaking` / `Oral Test` if added to attendance/grade entry.
3. **Backend & Frontend Calculation Engine**:
   - Dynamic formula reads weights from config/settings instead of hardcoded `0.10 / 0.35 / 0.55`.

---

## Feature Flags — Hide Local-Only Sections on Web

Use a single environment variable to control which pages are visible.

### Setup

**Vercel Dashboard → Environment Variables:**
```
VITE_APP_MODE = web
```

**Local `.env` file:**
```
VITE_APP_MODE = local
```

### Implementation in `frontend/src/config/tabs.tsx`

```tsx
const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';

export const tabs = [
  // Always visible on both web and local
  { id: 'students',  label: 'Hoc Sinh',  ... },
  { id: 'teachers',  label: 'Giao Vien', ... },
  { id: 'classes',   label: 'Lop Hoc',   ... },
  { id: 'schedule',  label: 'Lich Hoc',  ... },
  { id: 'reports',   label: 'Bao Cao',   ... },

  // Local only — hidden on web
  ...(isLocalMode ? [
    { id: 'question-bank',   label: 'Ngan Hang Cau Hoi', ... },
    { id: 'vocabulary-bank', label: 'Tu Vung',            ... },
    { id: 'formatter',       label: 'Tao De',             ... },
  ] : []),
];
```

### Also protect routes in the router

```tsx
{isLocalMode && <Route path="/question-bank"   element={<QuestionBank />} />}
{isLocalMode && <Route path="/vocabulary-bank" element={<VocabBank />} />}
```

### Result

| Page | Web (Vercel) | Local (Your PC) |
|---|---|---|
| Students | Visible | Visible |
| Teachers | Visible | Visible |
| Classes | Visible | Visible |
| Schedule | Visible | Visible |
| Reports | Visible | Visible |
| Question Bank | Hidden | Visible |
| Vocabulary Bank | Hidden | Visible |
| Formatter / TEST_FORMATTER | Hidden | Visible |

---

## File Storage — No Cloud Needed

Generated PDFs, Word docs, and compiled test files are generated on demand and
deleted after download. They do NOT need to be stored in the cloud.

- `cleanup_service.py` already handles this locally — same logic applies
- Student avatars: store in Supabase Storage (1GB free) if needed on web
- Config files (`prompts.json`, `exercise_config.json`, etc.): remain local only

---

## Storage Estimate (Reality Check)

| Data | Estimated Size |
|---|---|
| Students + Teachers + Classes | ~5-8 MB |
| Attendance + Grades | ~5 MB |
| Question Bank (10,000 questions) | ~5 MB |
| Vocabulary Bank (5,000 words) | ~1 MB |
| Total | ~15-20 MB |
| Supabase Free Limit | 500 MB |

Even with ALL tables on Supabase you use ~3% of the free limit.
Splitting databases to "save space" is not necessary.

---

## Prep Tasks — Do These Locally Before Deploying

These are small changes that cost nothing now but save hours of pain during deployment.

### 1. Fix `api.ts` — env-based API base URL (CRITICAL)

File: `frontend/src/api.ts` line 6

```ts
// Before
const API_BASE = '';

// After
const API_BASE = import.meta.env.VITE_API_URL ?? '';
```

Add to `frontend/.env`:
```
VITE_API_URL=
```
(empty = relative URL, works locally as-is)

On Vercel later, add env var:
```
VITE_API_URL=https://your-backend.vercel.app
```

---

### 2. Add `vercel.json` to frontend folder (CRITICAL)

Without this, refreshing any page (e.g. `/students`) gives a 404 on Vercel
because Vercel tries to serve a static file at that path instead of letting
React Router handle it.

Create `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### 3. Create `requirements.txt` (CRITICAL)

Vercel (and any Python host) needs this to install dependencies.

Run once in the project root:
```powershell
pip freeze > requirements.txt
```

---

### 4. Add `VITE_APP_MODE` feature flag

Create `frontend/.env`:
```
VITE_APP_MODE=local
VITE_API_URL=
```

On Vercel dashboard, set:
```
VITE_APP_MODE=web
VITE_API_URL=https://your-backend.vercel.app
```

Then gate local-only tabs in `frontend/src/config/tabs.tsx`:
```tsx
const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';

// Spread local-only tabs only when running locally
...(isLocalMode ? [
  { id: 'question-bank',   label: 'Ngan Hang Cau Hoi', ... },
  { id: 'vocabulary-bank', label: 'Tu Vung',            ... },
  { id: 'formatter',       label: 'Tao De',             ... },
] : []),
```

And protect routes in the router:
```tsx
{isLocalMode && <Route path="/question-bank"   element={<QuestionBank />} />}
{isLocalMode && <Route path="/vocabulary-bank" element={<VocabBank />} />}
```

---

### 5. Fix CORS to use env var (security)

File: `backend/main.py`

```python
import os

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

On Vercel backend, set env var:
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## Full Deployment Checklist (When Ready)

- [ ] Complete all 5 prep tasks above
- [ ] Create Supabase project and copy SQLite schema to PostgreSQL
- [ ] Migrate `backend/database/db_manager.py` from `sqlite3` to `psycopg2`
- [ ] Set `DATABASE_URL` env var in Vercel backend project
- [ ] Deploy frontend to Vercel (connect GitHub repo → `/frontend` root)
- [ ] Deploy backend to Vercel (connect GitHub repo → `/backend` root)
- [ ] Set all env vars in Vercel dashboards (both frontend and backend projects)
- [ ] **Bulk-create Supabase auth users from JSON/CSV file (see section below)**
- [ ] Test all web-visible pages end-to-end
- [ ] Verify local TEST_FORMATTER still works independently

---

## Auth User Management — Bulk Create from JSON/CSV

### How it works

Provide a JSON or CSV file with account info → agent runs a script to
bulk-create all users in Supabase via the Admin API in one shot.

### Expected input format (either works)

**JSON:**
```json
[
  { "email": "teacher1@gmail.com", "password": "pass123", "username": "co_lan",  "role": "teacher" },
  { "email": "teacher2@gmail.com", "password": "pass456", "username": "thay_duc", "role": "teacher" },
  { "email": "admin@gmail.com",    "password": "adminpass", "username": "admin", "role": "admin" }
]
```

**CSV:**
```
email,password,username,role
teacher1@gmail.com,pass123,co_lan,teacher
teacher2@gmail.com,pass456,thay_duc,teacher
admin@gmail.com,adminpass,admin,admin
```

### What the script does

For each row, calls Supabase Admin API:
```python
supabase.auth.admin.create_user({
    "email": row["email"],
    "password": row["password"],
    "email_confirm": True,        # skip confirmation email
    "user_metadata": {
        "username": row["username"],
        "role": row["role"]
    }
})
```

### Important notes

- Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars
- `SERVICE_ROLE_KEY` is in Supabase Dashboard → Settings → API → service_role key
- `email_confirm: True` means users can log in immediately, no verification email
- Run script once — idempotent (skip if email already exists)
- All data stays in `auth.users` — private, never publicly accessible
