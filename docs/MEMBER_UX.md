# Member UX

Member authentication foundation (Phase I-B1) lives on the public site:

| Route | Purpose |
|-------|---------|
| `/login` | Congregant sign-in |
| `/register` | Congregant registration |
| `/account` | Minimal member account (profile) |
| `/forgot-password` / `/reset-password` | Member password recovery |
| `/auth/callback` | Email confirm / recovery code exchange |

Staff CMS auth remains separate under `/admin/*`.

## Auth separation (current)

| Area | Auth helper | Who can access |
|------|-------------|----------------|
| Public site | none | Everyone |
| `/account` | `requireUser` → `/login` | Any authenticated user |
| `/give` online form | Supabase session when the payment flow requires it | Authenticated users |
| `/admin/(protected)/*` | `getCurrentAdmin` / `requireAdmin` | Users with an active `admins` row + role |

- Staff sign-in remains at `/admin/login`.
- Congregants are never added to `admins`.
- Connect Group membership UI is deferred to Phase I-B2+.

## Deferred

- Connect Group join / leave / approve
- Guest (anonymous) giving
- Self-serve “My Giving” history
- Bible study, notifications, CRM
