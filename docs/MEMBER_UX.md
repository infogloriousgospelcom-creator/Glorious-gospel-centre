# Member UX

Member authentication and Connect Group membership live on the public site.

| Route | Purpose |
|-------|---------|
| `/login` | Congregant sign-in |
| `/register` | Congregant registration |
| `/account` | Congregant Account Hub (profile, security, Connect Groups, My Giving, next steps) |
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

## Account Hub (`/account`)

The Account Hub includes:

| Section | What it does |
|---------|----------------|
| Profile | Edit own `full_name` and `phone` (RLS own-row). Soft profile completeness display (verified email, name, phone) — reminder only, not a gate. |
| Account security | Email verified / not verified badge. Unverified users can **resend verification** for the **current session email only** (no client-supplied email). Signed-in **change password** via session-bound Auth update (`audience=member` → stay on `/account`). |
| Connect Groups | Active / Pending / History. Active rows can **Leave** via the existing I-B3 `leave_connect_group` action. History shows re-request when `group_status === "OPEN"`. |
| My Giving | Self-serve history of gifts made while signed in (`giving_transactions.created_by = auth.uid()`). Safe columns only — never `admin_notes` or `raw_callback`. Legacy rows without `created_by` are not shown. |
| Your next steps | Deterministic CTAs from email verification + membership state (not a recommendation engine or CRM). |

Sign out remains available from the account header. Global nav shows **Account** when signed in (no separate member portal).

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

## My Giving (`/account`)

Read-only history of the signed-in member’s own `giving_transactions` rows where `created_by = auth.uid()`.

| Rule | Detail |
|------|--------|
| Ownership | Set by M-Pesa STK push as `created_by = auth.users.id`. Not inferred or backfilled. |
| Legacy rows | `created_by IS NULL` remain invisible to congregants. |
| Columns | Safe fields only (amount, category label, status, date, reference). Never `phone`, `admin_notes`, or `raw_callback`. |
| Client | Authenticated session Supabase client + RLS. No service-role for congregant reads. |
| Writes | I-B7 does not enable member INSERT/UPDATE/DELETE. Payment flows unchanged. |

Staff CMS giving still uses `giving.manage`; after column grants, admin private reads/writes of sensitive columns use service-role **after** the permission check.

## Staff moderation

| Route | Permission |
|-------|------------|
| `/admin/connect-groups` | `connect_groups.manage` (group CMS) |
| `/admin/connect-groups/[id]/members` | `connect_groups.members.manage` |

Staff can Approve, Decline, and Remove using the I-B4 moderation RPCs. Re-requested memberships appear as PENDING in the same list.

## Deferred

- Guest (anonymous) giving
- Giving receipts by email / notification delivery
- Bible study
- Notifications / email delivery for membership status
- Pastoral CRM / attendance / volunteering applications
- Connect Group leader roles
- PENDING withdrawal
- Staff direct reinstate (terminal → ACTIVE)
- Avatar upload
- Prayer / event / testimony personal history on `/account`
