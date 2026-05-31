# modMates

A group timetable optimisation web app for NUS students. modMates lets friend groups jointly optimise their NUSMods timetables to maximise shared tutorial and lab slots, with personalised constraints and collaborative features.

---

## Features

- NUSMods API integration — search modules and view timetable slots
- Group optimiser — solve for slot assignments that maximise shared slots across a group (WIP)
- Personal constraints — block out times, prefer certain slot types, etc. (WIP)
- Collaborative sessions — group members submit constraints and see their timetables reoptimise together (WIP)

- Social discovery board and smart group matching (WIP)
- Optimisation analytics and multi-solution comparison (WIP)
- AI-powered natural language constraint input (WIP)
- NUSMods export (WIP)
- Accounts and group management (WIP)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| ORM / Migrations | SQLAlchemy + Alembic |
| Solver | Z3 SMT solver |
| CI/CD | GitHub Actions |

---

## Current state

- **Auth** — Supabase email/password login and signup
- **NUSMods integration** — module search and full module detail (timetable slots)
- **Frontend UI** — auth form and module search
- **Database** — Supabase/PostgreSQL wired up
- **CI/CD** — GitHub Actions pipeline running lint, type-check, build, and tests for both frontend and backend

---

## Project structure

```
modMates/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Pydantic settings (env vars)
│   │   ├── database.py      # SQLAlchemy engine and session
│   │   ├── auth.py          # JWT validation (Supabase ES256)
│   │   └── routers/
│   │       └── modules.py   # /modules/search, /modules/{code}
│   ├── alembic/             # Database migrations
│   ├── tests/              
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx
        ├── api/modules.ts   # Backend API client
        ├── components/
        │   ├── AuthForm.tsx
        │   ├── Header.tsx
        │   └── NUSMods.tsx  # Module search and timetable display
        ├── contexts/
        │   └── AuthContext.tsx
        └── lib/supabase.ts
```
---

## Deployment

- **Frontend** — Vercel, at https://modmates.vercel.app/
- **Backend** — Render
