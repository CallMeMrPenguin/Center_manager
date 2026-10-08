# VPS & Web App Deployment Architecture

## Architecture Overview

```
Client (Desktop App / Web Browser)
 ├── React 19 + Vite + TypeScript (Client-side Rendering & Computations)
 └── Offline-First Local SQLite DB (Local Cache & Instant Operations)
                         ↕ (Bi-directional Sync & REST API)
VPS Central Server (Docker Compose)
 ├── Nginx (Reverse Proxy, SSL/TLS, Rate Limiting)
 ├── FastAPI Backend (Python 3.11+, JWT/HMAC Auth Guard, Data Validation)
 └── PostgreSQL 16 (Full Relational Database)
```

---

## Hosting Stack (Dedicated VPS)

| Layer | Technology | Deployment | Notes |
|---|---|---|---|
| Web Proxy | Nginx / Caddy | Docker Container | SSL Let's Encrypt, CORS, Rate-limiting |
| Backend | FastAPI (Python) | Docker Container | Gunicorn/Uvicorn, RBAC Guard, Server-side Validation |
| Database | PostgreSQL 16 | Docker Container | Persistent Volume, Automated backups |
| Frontend | Nginx Static / Local App | Static Web / Windows App | Zero-latency UI, client-side heavy compute |

---

## Database Architecture — VPS PostgreSQL

All central tables are hosted in the VPS PostgreSQL database (`postgres_schema.sql`):
- `students`
- `teachers_cm`
- `classes`, `class_students`, `class_schedule_weekly`, `class_sessions`, `class_seating`
- `courses`
- `student_scores`, `class_attendance_grades`
- `friend_groups`, `conflict_relationships`, `trusted_swap_relationships`
- `app_users`, `role_permissions`
- `custom_time_phases`, `assignments`, `assignment_submissions`

---

## Security & Anti-Tampering Standards

1. **Authentication & JWT/HMAC Tokens**:
   - Every API mutation requires a valid `Bearer <token>`.
   - Role-Based Access Control (RBAC): Only `Quản trị viên`, `Giáo viên`, and authorized staff roles can mutate class scores, attendance, and student profiles.
2. **Server-Side Data Bounds Validation**:
   - Even if client-side code is tampered with via DevTools or scripts, the backend strictly rejects invalid scores (`< 0.0` or `> 10.0`).
   - Attendance status is validated against an allowed enum (`Có mặt`, `Đi muộn`, `Có phép`, `Nghỉ`).
3. **Audit Log & Timestamps**:
   - `created_at` and `updated_at` are tracked via server-side clock timestamps.
