# Architecture

## Overview

Glorious Gospel Centre is built as a single Next.js 14 application (App Router) backed by Supabase. There is no separate application server; server-only operations run as Next.js Server Actions / Route Handlers / Supabase Edge Functions.

```
┌────────────────────┐      ┌────────────────────┐
│   Browser client   │ ───► │   Next.js (Vercel) │
│  React + Tailwind  │      │   Server Actions   │
└────────────────────┘      │   Route Handlers   │
                            └─────────┬──────────┘
                                      │
                                      ▼
                            ┌────────────────────┐
                            │ Supabase Postgres  │
                            │ + Auth + Storage   │
                            │ + Edge Functions   │
                            └────────────────────┘
```

## Layers

### 1. Presentation

- **App Router segments** under `app/` for both public (`app/(public)`) and admin (`app/admin`) routes.
- **Server Components** by default. Client components only where interactivity is required.
- **Layouts** (`app/layout.tsx`, route-level layouts) own chrome (Navbar, Footer, MobileMenu).
- **Design tokens** in `tailwind.config.ts`. Brand assets are placeholders and must be replaced via `tailwind.config.ts` once official branding is provided.

### 2. Components

- `components/layout/` — chrome (Navbar, Footer, TopBar, MobileMenu)
- `components/ui/` — generic primitives (Button, Card, Input, Modal, Badge, Alert, Skeleton)
- `components/<feature>/` — feature-specific composites

### 3. Data access

- `supabase/client.ts` — browser client (anon key only).
- `supabase/server.ts` — server client with cookie-based session, anon key.
- `supabase/middleware.ts` — refreshes Supabase session on every request.
- Privileged operations use the **service-role key**, only inside server-only modules (`import "server-only"`), and only when RLS-bypass is required (admin-side server actions, webhooks).

### 4. Environment & validation

- `lib/env.ts` validates env vars with Zod on startup.
- Public vars (`NEXT_PUBLIC_*`) are exposed to the browser.
- Server-only vars (`SUPABASE_SERVICE_ROLE_KEY`, M-Pesa secrets) are **never** imported into client code.

### 5. Database

- Schema managed via Supabase migrations in `supabase/migrations/`.
- RLS enabled on every public-facing table.
- Status columns (`draft / pending / published / archived`) gate public reads.

### 6. Storage

- Buckets: `church-images`, `event-posters`, `leader-images`, `sermon-thumbnails`, `gallery-images`, `media`.
- Storage policies enforced per bucket, mirroring DB roles.

### 7. Payments

- Abstract `PaymentProvider` interface.
- M-Pesa Daraja implementation via Supabase Edge Function with secrets stored as Edge Function secrets.
- Webhooks verify signatures before mutating state.

### 8. Auth & admin

- Supabase Auth (email/password) for administrators.
- `profiles` + `admins` tables link `auth.users` to internal roles.
- Middleware guards `/admin/*` routes.

### 9. Observability

- Server-side logging for auth failures, admin actions, prayer access, payment events.
- Sensitive fields (passwords, tokens, payment secrets, prayer bodies) are never logged.

## Security model

See [`SECURITY.md`](./SECURITY.md) for the full threat model and controls.

## Phased delivery

See [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md) — Phase 1 (foundation) complete; subsequent phases proceed sequentially.
