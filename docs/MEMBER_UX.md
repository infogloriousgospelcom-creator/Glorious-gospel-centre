# Member UX

Member authentication and Connect Group membership live on the public site.

| Route | Purpose |
|-------|---------|
| `/login` | Congregant sign-in |
| `/register` | Congregant registration |
| `/account` | Member account (profile + Connect Group memberships) |
| `/forgot-password` / `/reset-password` | Member password recovery |
| `/auth/callback` | Email confirm / recovery code exchange |
| `/connect` | Public Connect Group discovery |
| `/connect/[slug]` | Group detail + join / leave / re-request |

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
- Join and re-request require a verified email address.

## Connect Group membership lifecycle

```text
Join:
no membership → PENDING

Staff moderation:
PENDING → ACTIVE
PENDING → DECLINED
ACTIVE → REMOVED

Congregant leave:
ACTIVE → LEFT

Moderated re-request (same membership row):
DECLINED → PENDING
LEFT → PENDING
REMOVED → PENDING
```

Notes:

- Re-request reuses the existing `(connect_group_id, profile_id)` membership row. A second row is never created.
- Prior staff decisions remain in `audit_logs`; the membership row holds the current state only (`decided_*` / `admin_note` clear on re-request).
- Congregants never see `admin_note` or `decided_by`.
- Online PENDING withdrawal is not available; contact the church if needed.
- Staff do not have a direct reinstate path (terminal → ACTIVE). Members re-request to PENDING; staff approve or decline via the existing moderation UI.
- Notifications / email delivery are not part of the current membership system. Members learn status through `/account` and the group page.

## Staff moderation

| Route | Permission |
|-------|------------|
| `/admin/connect-groups` | `connect_groups.manage` (group CMS) |
| `/admin/connect-groups/[id]/members` | `connect_groups.members.manage` |

Staff can Approve, Decline, and Remove using the I-B4 moderation RPCs. Re-requested memberships appear as PENDING in the same list.

## Deferred

- Guest (anonymous) giving
- Self-serve “My Giving” history
- Bible study
- Notifications / email delivery for membership status
- Pastoral CRM / attendance / volunteering applications
- Connect Group leader roles
- PENDING withdrawal
- Staff direct reinstate (terminal → ACTIVE)
