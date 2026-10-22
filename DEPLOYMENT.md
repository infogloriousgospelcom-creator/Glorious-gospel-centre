# Deployment

This document describes how to deploy the **Glorious Gospel Centre**
website to production.

## Architecture (target)

```
GitHub
   │
   ▼
develop ──► PR ──► CI checks (lint, typecheck, test, build)
   │
   ▼
main
   │
   ▼
Vercel (frontend)
Supabase (database + auth + storage + edge functions)
```

| Component | Provider |
| --- | --- |
| Frontend (Next.js) | **Vercel** |
| Database | **Supabase Postgres** |
| Auth | **Supabase Auth** |
| Storage | **Supabase Storage** |
| Server-side functions | **Next.js Server Actions** (Vercel) + **Supabase Edge Functions** (M-Pesa) |
| Payments | **M-Pesa Daraja** via Edge Function |

## Prerequisites

- A GitHub repository (this one).
- A Vercel account connected to the GitHub org.
- A Supabase project (Free tier or higher).
- A custom domain (optional, but recommended for production).

## Local environment

Copy the example env file and fill values:

```bash
cp .env.example .env.local
```

`.env.local` is gitignored and never committed.

| Variable | Public? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical / OG base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser-side anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | Bypasses RLS — only server-side |
| `M_PESA_*` | **no** | Daraja API credentials (mock mode if missing) |

See `.env.example` for the full list.

## Supabase setup

1. Create a new Supabase project.
2. Apply the migrations in `supabase/migrations/` in order:
   ```bash
   supabase db push
   # or paste each file into the SQL editor in numeric order
   ```
3. Configure Storage buckets (created by migration `0010`):
   `church-images`, `event-posters`, `leader-images`,
   `sermon-thumbnails`, `gallery-images`, `media`.
4. In **Auth → URL Configuration**, set the Site URL to
   `https://your-domain.example` and add
   `https://your-domain.example/admin/reset-password` as a redirect.
5. Create the first administrator — see [`FIRST_ADMIN.md`](./FIRST_ADMIN.md).
   Do NOT seed passwords into the repository.
6. Create a copy of `site_settings` (one row, defaults) by signing into
   the admin dashboard and visiting Site Settings → Save.

## M-Pesa (live payments)

Until live M-Pesa credentials are provisioned, the giving page runs in
**mock mode**. No money is requested, no STK push is made. Submissions
are still recorded for end-to-end testing.

When the church is ready to go live:

1. Get sandbox credentials from the Daraja developer portal.
2. Deploy the `mpesa-stk-push` Edge Function with the credentials set
   as Edge Function secrets.
3. Set `M_PESA_ENVIRONMENT=production` and rotate to production keys.
5. Set the public `M_PESA_CALLBACK_URL` to your Edge Function callback URL.
6. Test the full STK push flow against a sandbox shortcode first.

The giving form detects missing credentials and shows a non-blocking
warning.

## Vercel setup

1. Import the GitHub repository into Vercel.
2. Project settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Install Command:** `npm ci`
   - **Output Directory:** leave default
   - **Node Version:** 20.x
3. Set environment variables (Production + Preview):
   - `NEXT_PUBLIC_SITE_URL` = your production URL
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - M-Pesa variables if going live
4. Under **Settings → Git**, enable **Deploy hooks** for the
   `main` branch only.
5. **NOT** required: branch protection / GitHub Actions will already
   gate `main` (see below).

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and PR to `main` and
`develop`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`

A merge to `main` should only happen when this workflow is green.

## Promotion flow

1. Work on a `feature/*` branch off `develop`.
2. Open a PR into `develop`. CI must pass.
3. Merge. Vercel deploys the `develop` branch to a preview URL.
4. Smoke test the preview.
5. Open a PR from `develop` into `main`. CI must pass again.
6. Merge. Vercel deploys `main` to production.

## Post-deploy checks

After the first production deploy:

- [ ] `https://<your-domain>/sitemap.xml` returns a non-empty sitemap.
- [ ] `https://<your-domain>/robots.txt` references the sitemap.
- [ ] Open Graph preview shows the church OG image and title.
- [ ] Lighthouse / axe accessibility scan on the homepage passes AA.
- [ ] Sign in to `/admin/login` with the first admin.
- [ ] Submit a contact form — record appears in `/admin/messages`.
- [ ] Submit a prayer request — record appears in `/admin/prayer-requests`.
- [ ] Submit a small giving amount in mock mode — record appears in
      `/admin/giving` with status `PENDING`.
- [ ] Database backups are enabled in the Supabase dashboard.

## Rollback

- Vercel keeps every deployment. Use the **Promote to Production**
  button on a previous deployment to roll back without a redeploy.
- Database migrations: keep a downgrade migration alongside each
  migration that mutates schema. We never edit migrations after they
  have been applied to production.

## Disaster recovery

- Supabase project snapshots are taken daily (Pro plan) or weekly
  (Free plan). Restore via the dashboard.
- `.env.local` (and the equivalent Vercel envs) are not in version
  control. Store them in the church's 1Password / Bitwarden.
- All admin actions are recorded in `audit_logs` (RLS-protected).