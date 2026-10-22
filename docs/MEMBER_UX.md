# Member UX

Member authentication and Connect Group membership live on the public site.

| Route | Purpose |
|-------|---------|
| `/login` | Congregant sign-in |
| `/register` | Congregant registration |
| `/account` | Congregant Account Hub (profile, security, Connect Groups, My Giving, Activity, Church Notices, Serving Interests, next steps) |
| `/serve` | Public serve page + verified-member ministry serve-interest form |
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
- Join and re-request require a verified email address at **both** the application action and the **database** boundary (insert trigger + re-request RPC). Unverified JWTs cannot create or re-request membership via PostgREST.

## Account Hub (`/account`)

The Account Hub includes:

| Section | What it does |
|---------|----------------|
| Profile | Edit own `full_name` and `phone` (RLS own-row). Soft profile completeness display (verified email, name, phone) — reminder only, not a gate. |
| Account security | Email verified / not verified badge. Unverified users can **resend verification** for the **current session email only** (no client-supplied email). Signed-in **change password** via session-bound Auth update (`audience=member` → stay on `/account`). |
| Connect Groups | Active / Pending / History. Active rows can **Leave** via the existing I-B3 `leave_connect_group` action. History shows re-request when `group_status === "OPEN"`. |
| My Giving | Self-serve history of gifts made while signed in (`giving_transactions.created_by = auth.uid()`). Safe columns only — never `admin_notes` or `raw_callback`. Legacy rows without `created_by` are not shown. |
| Activity | In-app notifications for the signed-in member only (`member_notifications.recipient_id = auth.uid()`). Currently Connect Group approve / decline / remove. |
| Church Notices | Read-only published church announcements (same public source as the homepage). Not a personal inbox. |
| Serving Interests | Compact list of the member’s own ministry serve-interest submissions (ministry, status, submitted date). Staff notes and reviewer identity are never shown. |
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
- Re-request increments `membership_generation` on that row (starts at 1). Each new PENDING cycle gets a new lifecycle identity.
- Prior staff decisions remain in `audit_logs`; the membership row holds the current state only (`decided_*` / `admin_note` clear on re-request).
- Congregants never see `admin_note` or `decided_by`.
- Online PENDING withdrawal is not available; contact the church if needed.
- Staff do not have a direct reinstate path (terminal → ACTIVE). Members re-request to PENDING; staff approve or decline via the existing moderation UI.
- Membership status is also surfaced as in-app Activity notifications for approve / decline / remove (see below). Leave and re-request do not emit notifications yet.

## Activity / Notifications (`/account`)

In-app inbox only (`public.member_notifications`). No email, WhatsApp, or Realtime in the current phase.

| Rule | Detail |
|------|--------|
| Ownership | `recipient_id = auth.uid()`. Recipient is derived from `connect_group_members.profile_id` at emit time — never from browser input. |
| Supported kinds | `connect_group.approved`, `connect_group.declined`, `connect_group.removed` |
| Mark read | `mark_member_notification_read(uuid)` — updates `read_at` only after ownership check. |
| Emit | Trusted `emit_member_notification` from moderation RPCs. `INSERT … ON CONFLICT (dedupe_key) DO NOTHING`. |
| Dedupe key | `{recipient_id}:connect_group_member:{membership_id}:g{membership_generation}:{event_key}` |
| Lifecycle | Re-request increments `membership_generation`, so a later approve/decline/remove creates a **new** Activity row. Retrying the **same** moderation call in the same cycle remains idempotent (status guard + dedupe). |
| Links | Safe relative paths only (`/connect/[slug]` or `/account`). Never `/admin`, absolute, or scheme URLs. |
| Content | No `admin_note`, staff IDs, or private moderation details. |

Deferred: email/WhatsApp delivery, Realtime badges, giving payment notifications, leave / re-request events, unread nav badge.

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

## Ministry Serve Interest (Phase K)

Owned congregant workflow — not a volunteer roster, scheduling, or guest application system.

```text
Serve / Ministry page
    ↓
Express Interest (login with safe redirect_to / next if needed)
    ↓
Verified member submits ministry or general interest
    ↓
Staff review on /admin/serve-interests
    ↓
Member sees status on /account (Serving Interests)
```

| Rule | Detail |
|------|--------|
| Ownership | `ministry_serve_interests.profile_id = auth.uid()`. The browser cannot choose another profile. |
| Verified email | Application check plus the existing I-B10 `require_verified_email_for_membership()` helper on INSERT. Unverified JWTs cannot insert via PostgREST. |
| Congregant fields | `ministry_id` (nullable for general serving), `member_note` (optional, ≤500), identity, timestamps. |
| Staff fields | `status`, `staff_note`, `reviewed_by`, `reviewed_at`. Members cannot SELECT or write these private columns. |
| Statuses | `NEW` Received · `CONTACTED` We are in touch · `ACCEPTED` Accepted · `DECLINED` Not moving forward · `CLOSED` Closed. |
| Duplicate policy | One **open** interest (`NEW` / `CONTACTED` / `ACCEPTED`) per member + ministry, or per member when ministry is null. `DECLINED` / `CLOSED` history does not block a later submission. Existing open rows are not overwritten. |
| Client | Member INSERT/SELECT uses the authenticated session client + RLS. No service-role for ordinary congregant submission or read. |
| Staff | Permission `serve_interests.manage` (SUPER_ADMIN + ADMIN). List/detail private reads use service-role **after** the permission check. Status updates go through `update_ministry_serve_interest`; reviewer identity and timestamp are server-derived. |
| Audit | Staff status changes write `serve_interest.status_change` (interest id, previous/new status, ministry). Audit failures do not break the update. |
| Rate limit | Member submit: existing `consumeAsync` limiter (5 / 15 minutes per IP hash + email hash + ministry). |
| Privacy | Interests are not in the sitemap, public ministry queries, or anonymous APIs. Contact remains a separate unstructured inquiry. |
| Notifications | None in Phase K. No email, WhatsApp, Realtime, or Activity fan-out. |

Staff CMS: `/admin/serve-interests` and `/admin/serve-interests/[id]`.

## Staff moderation

| Route | Permission |
|-------|------------|
| `/admin/connect-groups` | `connect_groups.manage` (group CMS) |
| `/admin/connect-groups/[id]/members` | `connect_groups.members.manage` |
| `/admin/serve-interests` | `serve_interests.manage` |

Staff can Approve, Decline, and Remove using the I-B4 moderation RPCs. Re-requested memberships appear as PENDING in the same list. Approve / decline / remove also emit member Activity notifications.

## Deferred

- Guest (anonymous) giving
- Giving receipts by email / in-app giving notifications
- Email / WhatsApp / Realtime notification delivery
- Leave / re-request Activity events
- Unread badge on Account nav
- Bible study
- Pastoral CRM / attendance / volunteer roster, scheduling, skills matrix, ministry assignments, or ministry-leader accounts
- Guest (anonymous) serve-interest applications
- Event registration capacity (count-then-insert is not race-safe; `registration_capacity` unused)
- Unique event-registration constraint (24-hour email soft-check remains)
- Serve-interest email / WhatsApp / Realtime / Activity notifications
- Connect Group leader roles
- PENDING withdrawal
- Staff direct reinstate (terminal → ACTIVE)
- Avatar upload
- Prayer / event / testimony personal history on `/account`
