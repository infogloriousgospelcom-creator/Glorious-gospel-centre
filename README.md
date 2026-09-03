# Glorious Gospel Centre Church — Website & Admin Platform

Production website and CMS-driven administration platform for Glorious Gospel Centre Church.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, RLS)
- **Hosting (target):** Vercel + Supabase

## Status

**Phase 1 — Foundation** complete. See [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md) for the full audit and the master engineering plan phases.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill values, never commit
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Repository layout

```
app/                 Next.js App Router (public + admin)
components/          Reusable UI (layout, ui, feature groups)
lib/                 Client-safe utilities (env, utils)
supabase/            Supabase client wrappers (browser, server, middleware)
types/               Shared TypeScript types
styles/              Global CSS + Tailwind base
```

## Branching

- `main` — production
- `develop` — integration
- `feature/*` — individual work

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

## Documentation

- [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)

## Security

Never commit `.env.local` or any secrets. The service-role key, M-Pesa secrets, and similar credentials must live only in local / hosting environment configuration. See [`SECURITY.md`](./SECURITY.md).
