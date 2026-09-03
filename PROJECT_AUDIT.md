# Glorious Gospel Centre Church — Project Audit (Phase 0)

**Date:** 2026-09-03
**Auditor:** Senior Engineering Team
**Repository:** https://github.com/infogloriousgospelcom-creator/Glorious-gospel-centre
**Working Directory:** `C:\Users\musil\Desktop\GLORIOUS GOSPEL CENTRE`

---

## PROJECT STATUS

| Item | Status |
| --- | --- |
| Local project | Empty directory — no source files |
| Git repository (local) | Not initialized |
| GitHub repository | Exists, public, **empty (size 0, no commits, default branch `main`)** |
| Supabase project | Not connected (no env, no CLI link, no migrations) |
| Hosting / deployment | Not configured |
| CI/CD | Not configured |
| Documentation | Not present |

The project is a **greenfield build**. Nothing pre-existing must be migrated or replaced.

---

## ENVIRONMENT AUDIT

| Tool | Version | Available |
| --- | --- | --- |
| Node.js | v24.19.0 | Yes |
| npm | 11.17.0 | Yes |
| Git | 2.55.0 (Windows) | Yes |
| Supabase CLI | 2.115.0 (update available) | Yes |

Notes:
- Supabase CLI reports an update (2.116.0); we will pin/upgrade as part of Phase 1 foundation work.
- No package manager lockfile present — npm is the chosen package manager.

---

## CURRENT ARCHITECTURE

- **None.** No source files, no `package.json`, no configuration, no database.
- Default branch on the remote is `main` with zero commits.

---

## RECOMMENDED ARCHITECTURE

### Stack

- **Framework:** Next.js 14+ (App Router) on Node 24
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with a centralized design-system token layer
- **Components:** Reusable React Server + Client components
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, RLS)
- **Validation:** Zod (client + server)
- **Linting / Formatting:** ESLint + Prettier
- **Testing:** Vitest (unit) + Playwright (E2E) — to be introduced in Phase 24
- **CI/CD:** GitHub Actions (lint, typecheck, test, build)
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **Source Control:** GitHub — branching strategy: `main` (production), `develop` (integration), `feature/*`

### Repository Structure (target)

```
.
├── app/                       # Next.js App Router (public + admin)
│   ├── (public)/              # Public-facing pages
│   ├── admin/                 # Admin platform
│   ├── api/                   # Webhooks only (e.g., M-Pesa callback)
│   └── layout.tsx
├── components/
│   ├── layout/                # Navbar, Footer, MobileMenu, TopBar
│   ├── ui/                    # Button, Card, Input, Modal, Badge...
│   ├── home/ events/ sermons/ ministries/ gallery/ prayer/ giving/ contact/ admin/
├── lib/                       # Client utilities
├── server/                    # Server-only utilities (service-role, edge)
├── services/                  # Supabase data-access wrappers
├── hooks/
├── types/                     # Shared TypeScript types
├── utils/
├── supabase/
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server client (cookie-based session)
│   └── middleware.ts          # Session refresh helper
├── styles/                    # Global CSS + design tokens
├── public/
├── supabase/                  # Supabase CLI project
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
├── .github/workflows/         # CI
├── .env.example
├── .env.local                 # NOT committed
├── README.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
└── SECURITY.md
```

### Database (Supabase)

Initial entities (with RLS):

```
profiles
admins
roles
permissions
pages
page_revisions
announcements
services
service_categories
ministries
ministry_leaders
leaders
events
event_registrations
sermons
media
gallery_albums
gallery_items
prayer_requests
giving_categories
giving_transactions
contact_messages
newsletter_subscribers
site_settings
social_links
audit_logs
```

UUID primary keys, indexed FKs, `created_at`/`updated_at`, RLS on every public-facing table.

### Security posture

- Supabase anon key exposed to the browser (intended).
- Service-role key restricted to server-only contexts (Next.js Server Actions / Route Handlers / Edge Functions).
- Strict RLS: public SELECT only on `status = 'PUBLISHED'` (or equivalent) rows.
- Prayer requests: confidential, admin-only, with audit logging on every read.
- Payments: abstract provider interface (`PaymentProvider`); M-Pesa credentials live as Supabase Edge Function secrets only; webhook signature verification mandatory.

---

## SUPABASE STATUS

- **Not configured.** No project, no env vars, no migrations, no Edge Functions.
- Supabase CLI is installed locally and ready for `supabase init` and `supabase link`.

### Action (Phase 3 will require explicit user input)

- We need:
  - A Supabase project (or `PROJECT_REF`) to link.
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Optional M-Pesa Daraja credentials.
- Until provided, **no live database work proceeds.** Phase 1–2 (foundation + design system) can be completed without them. Phase 3 (database) will pause for credentials.

---

## GITHUB STATUS

- Repo: `infogloriousgospelcom-creator/Glorious-gospel-centre`
- Visibility: public
- Default branch: `main`
- Commits: 0
- Size: 0 KB
- Description: "Church website"

### Plan

- Create `develop` branch off `main` (Phase 1).
- Protect `main` (require PR + passing CI) — to be configured when the GitHub account permits; otherwise documented in `CONTRIBUTING.md`.
- All feature work on `feature/*` branches.

---

## SECURITY FINDINGS (PRE-IMPLEMENTATION)

No existing code, so no existing vulnerabilities. Preventive requirements:

1. Never commit secrets; only `.env.example` is tracked.
2. RLS on every table from day one (migrations will include `ENABLE ROW LEVEL SECURITY`).
3. Service-role key restricted to server-only modules.
4. All forms validated with Zod on both client and server.
5. Prayer request access is audited.
6. Payment webhooks verify signatures.
7. CSP headers + security headers configured in `next.config.ts`.
8. No raw DB errors shown to end users.

---

## MIGRATION PLAN

There is no existing application to migrate. The only migration tasks are operational:

1. Initialize local git repo, add remote.
2. Create `develop` branch.
3. Bootstrap Next.js + TypeScript + Tailwind.
4. Create `.env.example`, `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`.
5. Initialize Supabase project structure (`supabase init`).
6. Write the first migration (full schema).
7. Push `develop` branch and open PR into `main`.

---

## PHASE 0 CHANGES

**Files to be created in Phase 0 (this commit):**

- `PROJECT_AUDIT.md` (this document)

**No code changes yet.** Phase 0 is audit-only per the master prompt.

---

## NEXT PHASE

**Phase 1 — Foundation** (after explicit user approval):

- Initialize Next.js 14 (App Router) + TypeScript (strict).
- ESLint + Prettier.
- Tailwind CSS with token-based theme.
- Base `app/` layout (Navbar placeholder, Footer placeholder, 404 page, error boundary, loading state).
- `lib/`, `types/`, `hooks/`, `services/`, `utils/` skeleton.
- Supabase client wrappers (browser + server).
- Environment validation with Zod.
- `.env.example`, `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`.
- First push to `develop`.

---

## BLOCKERS / ITEMS REQUIRING USER INPUT

1. **Supabase project credentials** — required to wire the app to a real backend. We can proceed with local-only mock client in Phase 1 and link when credentials are available.
2. **Brand assets** (logo, color palette, fonts) — placeholders will be used; CMS-driven swap.
3. **M-Pesa / bank details** — placeholders only; CMS-managed.
4. **GitHub Actions permissions** — will configure as part of CI setup; confirm if the repo owner wants PR-only merges into `main`.

---

**End of audit. Awaiting approval to begin Phase 1.**
