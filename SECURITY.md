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
- A root `middleware.ts` re-exports `supabase/middleware.ts` to refresh
  sessions on every request — admin gates rely on the cookie-refreshing
  middleware plus per-page `requireAdmin()` / `requirePermission()`.
- Login (`signInAction`) is rate-limited by both client IP and
  lower-cased email.
- Frontend role checks are UX only; **all** authorization is enforced
  server-side via RLS and server actions.

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

- M-Pesa STK Push initiated server-side only; secrets stored as hosting
  environment variables (not in source control, never exposed to the
  browser).
- `M_PESA_CALLBACK_SECRET` is mandatory and **must** be a unique value —
  never reuse `M_PESA_PASSKEY` as a fallback.
- The Daraja webhook (`/api/mpesa/callback`) verifies signatures via
  `timingSafeEqual` and mutates `giving_transactions` using the
  service-role client (RLS bypassed; the webhook is unauthenticated).
- Webhook idempotency: terminal state (`SUCCESS`) is never re-applied.
- Transactions never marked successful solely on client signal.
- See `SECURITY_AUDIT.md` for the live-mode signature caveat.

### Headers

`next.config.mjs` sets (applied to every path):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Content-Security-Policy: default-src 'self'; …` (see `next.config.mjs`)

### Logging

Logged: authentication failures, admin actions, prayer request access, payment events, server errors.
Never logged: passwords, access tokens, service-role keys, payment secrets, raw prayer bodies (only metadata).

`approval_history.note` and `giving_transactions.admin_notes` are echoed
into `audit_logs.metadata`. Admins should keep these notes operational
(no donor names or amounts) — anything written there is then visible to
any user with the `audit.view` permission.

### Open redirects

The login flow honours a `redirect_to` query parameter when present. The
helper `safeAdminRedirect()` rejects anything that is not an internal
path under `/admin`, including protocol-relative (`//evil.com`),
backslash-prefixed (`/\\evil.com`), and URL-encoded variants.

### Service-role key

The service-role key bypasses RLS. It is used in exactly three server-only
modules:

- `lib/service-role.ts` (single source — `getServiceRoleClient()`).
- `lib/audit.ts` (writes to `audit_logs`).
- `services/admin/approvals.workflow.ts` (writes to `approval_history`).
- `services/giving.ts` (`applyCallback` updates `giving_transactions`
  from the M-Pesa webhook).

No client module imports the service-role key. The key is not embedded
in any client bundle.

### Rate limiting

`lib/rate-limit.ts` is an in-memory token bucket. **Single-instance
only.** Multi-instance / serverless deployments must replace it with a
shared store (Upstash Redis, Vercel KV, Supabase KV) before going live.

## Reporting vulnerabilities

For now, report issues to the project lead. A formal disclosure process will be added in a later phase.

For the Phase 20 audit findings and remediation history, see
[`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).
