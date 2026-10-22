# Glorious Gospel Centre Church — Website & Admin Platform

Production website and CMS-driven administration platform for Glorious Gospel Centre Church.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, RLS)
- **Hosting (target):** Vercel + Supabase
- **Testing:** Vitest (68 unit tests)
- **CI/CD:** GitHub Actions (lint, typecheck, test, build)

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
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |

## Repository layout

```
app/                 Next.js App Router (public + admin)
components/          Reusable UI (layout, ui, feature groups)
lib/                 Client-safe utilities (env, utils, a11y, media, rate-limit, ip-hash, audit, seo)
services/            Server-side data access and server actions
supabase/            Supabase client wrappers + migrations
tests/               Vitest unit tests
types/               Shared TypeScript types
public/              Static assets (OG default, etc.)
.vercel/            ignored
```

## SEO, Accessibility, Performance

- **Metadata:** every public page routes through `lib/seo.ts` for unique
  title, description, OG, Twitter card, and canonical URL.
- **Sitemap:** `app/sitemap.ts` is generated dynamically from the
  database and the static route list.
- **Robots:** `app/robots.ts` allows the public site, disallows
  `/admin` and `/api`.
- **Structured data:** `Church`, `Event`, `VideoObject`, `BreadcrumbList`,
  and `ImageGallery` JSON-LD on the relevant pages.
- **Accessibility:** see [`ACCESSIBILITY.md`](./ACCESSIBILITY.md) for
  the WCAG 2.1 AA patterns in use.
- **Headers:** `next.config.mjs` sets HSTS, frame-options, referrer,
  content-type-options, and a strict permissions-policy.

## Branching

- `main` — production
- `develop` — integration
- `feature/*` — individual work

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

## Documentation

- [`PROJECT_AUDIT.md`](./PROJECT_AUDIT.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- [`ACCESSIBILITY.md`](./ACCESSIBILITY.md)
- [`SECURITY.md`](./SECURITY.md)
- [`FIRST_ADMIN.md`](./FIRST_ADMIN.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

## Security

Never commit `.env.local` or any secrets. The service-role key, M-Pesa
secrets, and similar credentials must live only in local / hosting
environment configuration. See [`SECURITY.md`](./SECURITY.md).