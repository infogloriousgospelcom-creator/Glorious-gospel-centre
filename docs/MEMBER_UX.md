# Member UX

Member account UI on the public site was removed. Online giving and the public website do not expose a member “Account” area.

## Auth separation (current)

| Area | Auth helper | Who can access |
|------|-------------|----------------|
| Public site | none | Everyone |
| `/give` online form | Supabase session when the payment flow requires it | Authenticated users (no public account shell) |
| `/admin/(protected)/*` | `getCurrentAdmin` / `requireAdmin` | Users with an active `admins` row + role |

- Staff sign-in remains at `/admin/login`.
- Admin CMS stays separate from the public site chrome.
- `getCurrentUser()` remains available for server-side session checks (e.g. giving) but there is no `/account` route tree.

## Deferred

- Guest (anonymous) giving, if product wants it without a member portal
- Self-serve “My Giving” / member portal (would need RLS + a deliberate product decision)
- Bible study, notifications, CRM (Phase F)
