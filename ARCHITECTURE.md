# Architecture

## Overview

Glorious Gospel Centre is built as a single Next.js 14 application
(App Router) backed by Supabase. There is no separate application
server; server-only operations run as Next.js Server Actions / Route
Handlers / Supabase Edge Functions.

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

- **App Router segments** under `app/` for both public and admin
  routes.
- **Server Components** by default. Client components only where
  interactivity is required.
- **Layouts** (`app/layout.tsx`, route-level layouts) own chrome
  (Navbar, Footer, MobileMenu).
- **Design tokens** in `tailwind.config.ts`. Brand assets are
  placeholders and must be replaced via `tailwind.config.ts` once
  official branding is provided.

### 2. Components

- `components/layout/` — chrome (Navbar, Footer, TopBar, MobileMenu,
  AdminSubnav, AboutSubnav)
- `components/ui/` — generic primitives (Button, Card, Input, Modal,
  Badge, Alert, Skeleton)
- `components/seo/` — JSON-LD renderer
- `components/<feature>/` — feature-specific composites (home, about,
  admin)

### 3. Data access

- `supabase/client.ts` — browser client (anon key only).
- `supabase/server.ts` — server client with cookie-based session, anon key.
- `supabase/middleware.ts` — refreshes Supabase session on every request.
- Privileged operations use the **service-role key**, only inside
  server-only modules (`import "server-only"`), and only when RLS-bypass
  is required (admin-side server actions, webhooks, audit logging).

### 4. Environment & validation

- `lib/env.ts` validates env vars with Zod on startup.
- Public vars (`NEXT_PUBLIC_*`) are exposed to the browser.
- Server-only vars (`SUPABASE_SERVICE_ROLE_KEY`, M-Pesa secrets) are
  **never** imported into client code.
- `lib/seo.ts` builds metadata, OG tags, and structured data.
- `lib/a11y.ts` exposes accessibility helpers (focus, motion).
- `lib/rate-limit.ts` is a per-process token bucket.
- `lib/ip-hash.ts` hashes the client IP for audit logging without
  storing the raw IP.
- `lib/audit.ts` writes rows to `audit_logs` via the service-role
  client and never throws into the caller.

### 5. Database

- Schema managed via Supabase migrations in `supabase/migrations/`.
- RLS enabled on every public-facing table.
- Status columns (`draft / pending / published / archived`) gate
  public reads.
- Approved → published is a workflow, not a toggle.

### 6. Storage

- Buckets: `church-images`, `event-posters`, `leader-images`,
  `sermon-thumbnails`, `gallery-images`, `media`.
- Storage policies enforced per bucket, mirroring DB roles.
- File type and size are validated on upload server-side.
- Public URLs are constructed via `services/gallery/publicStorageUrl`.

### 7. Payments

- Abstract `PaymentProvider` interface.
- M-Pesa Daraja implementation via Supabase Edge Function with secrets
  stored as Edge Function secrets.
- Webhooks verify signatures before mutating state.
- The system is in **mock mode** until credentials are provisioned.

### 8. Auth & admin

- Supabase Auth (email/password) for administrators.
- `profiles` + `admins` tables link `auth.users` to internal roles.
- Middleware guards `/admin/*` routes.
- `services/auth.ts` exposes `getCurrentAdmin`, `requireAdmin`,
  `requireRole`, and the role/permission map.
- The first admin must be created manually — see
  [`FIRST_ADMIN.md`](./FIRST_ADMIN.md). Production passwords are
  never stored in source.

### 9. SEO

- Every public page produces a unique title, description, OG image,
  and Twitter card via `lib/seo.ts`.
- `app/sitemap.ts` is dynamic and includes static + DB-driven routes.
- `app/robots.ts` disallows `/admin` and `/api`.
- Structured data (JSON-LD) is rendered for `Church`, `Event`,
  `VideoObject`, `BreadcrumbList`, and `ImageGallery`.
- Admin pages set `robots: { index: false, follow: false }`.

### 10. Observability

- Server-side logging for auth failures, admin actions, prayer
  access, payment events, and server errors.
- Sensitive fields (passwords, tokens, payment secrets, prayer
  bodies) are never logged.
- Audit log table (`audit_logs`) records privileged mutations.

### 11. Testing

- Vitest unit tests for utilities, schemas, services, and media.
- 68 unit tests at last count.
- `npm test` runs them; CI runs them on every PR.

## Security model

See [`SECURITY.md`](./SECURITY.md) for the full threat model and
controls.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for hosting, CI/CD, and
production promotion flow.

## Phased delivery

See [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md) for the master engineering
plan. All 25 phases complete.