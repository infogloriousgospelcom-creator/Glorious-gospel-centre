# Security

## Threat model

Public visitors, authenticated administrators, and external integrations (M-Pesa webhooks). Confidential data includes prayer requests and admin session tokens.

## Controls

### Secrets

- `.env.local` is gitignored.
- `.env.example` contains variable names only.
- Service-role key, M-Pesa credentials, and other server-only secrets **never** reach the browser bundle.
- Hosting environment variables are configured per-environment (Vercel / Supabase Edge Function secrets), never in source control.

### Authentication

- Supabase Auth (email/password) for administrators.
- Sessions are HTTP-only cookies managed by `@supabase/ssr`.
- Middleware refreshes sessions and gates `/admin/*` routes.
- Frontend role checks are UX only; **all** authorization is enforced server-side via RLS and server actions.

### Authorization (RLS)

- Every public-facing table has Row Level Security **enabled**.
- Public SELECT policies only expose rows where `status = 'PUBLISHED'` (or equivalent).
- Admin-only tables (audit logs, prayer requests, settings) require role membership via Postgres functions.
- Prayer requests are confidential: only authorized staff may read them; reads are logged.

### Input validation

- All forms validated with Zod on both client (UX) and server (security).
- Route parameters and query strings validated before use.

### Storage

- Buckets: `church-images`, `event-posters`, `leader-images`, `sermon-thumbnails`, `gallery-images`, `media`.
- Per-bucket policies: public read for published assets, authenticated write for admins.
- File type and size validated on upload (server-side).

### Payments

- M-Pesa STK Push initiated server-side only; secrets stored as Edge Function secrets.
- Webhook callbacks verify signatures before mutating state.
- Transactions never marked successful solely on client signal.

### Headers

`next.config.mjs` sets:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### Logging

Logged: authentication failures, admin actions, prayer request access, payment events, server errors.
Never logged: passwords, access tokens, service-role keys, payment secrets, raw prayer bodies (only metadata).

## Reporting vulnerabilities

For now, report issues to the project lead. A formal disclosure process will be added in a later phase.
