# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the 17 Critical and 21 High findings from `docs/AUDIT_2026-10-21.md`, restoring admin access, payment integrity, gallery functionality and search rankings, then close the Medium/Low backlog and product gaps.

**Architecture:** This plan covers four independent subsystems — (A) authorization & RLS, (B) payment integrity, (C) SEO/a11y foundations, (D) query correctness & performance. They touch disjoint files except where noted, so Waves 1A/1B/1C can run in parallel by different agents. Each wave is independently shippable and verified by its own tests.

**Tech Stack:** Next.js 14.2.15 App Router · TypeScript 5.6 strict · Supabase (Postgres 15, Auth, Storage, Edge Functions on Deno) · Zod 3.23 · Vitest 1.6 · Tailwind 3.4

**Spec:** `docs/AUDIT_2026-10-21.md` — read this first; every task below cites its finding number (e.g. `#12`).

## Global Constraints

- **Never edit an existing migration file.** Migrations are append-only. All schema changes ship as a new numbered file, next number `0039`.
- **Migrations are ordered and irreversible.** No down-migrations exist; every new migration must be forward-safe and idempotent where practical (`drop policy if exists` before `create policy`).
- **No `any`, no `as any`, no `@ts-ignore`, no `eslint-disable`.** `CONTRIBUTING.md:55` requires this and the codebase currently honours it. `npm run typecheck` and `npm run lint` must stay clean.
- **All new server inputs are validated with Zod** before touching Supabase, matching the existing pattern in `lib/*-schema.ts`.
- **All new admin mutations write an audit log** via `writeAuditLog` from `lib/audit.ts`, with `actorId`, `action`, `entityType`, `entityId`, `metadata`, `ipHash`.
- **All permission checks go through `supabase.rpc("has_permission", { permission_key })`** with the user-scoped client from `supabase/server.ts` — never the service-role client.
- **Service-role client (`supabase/admin.ts`) is server-only** and is only used after a permission check has already passed.
- **No secrets in the client bundle.** `getServerEnv()` stays in `server-only` modules only.
- **Dates rendered to users use `Africa/Nairobi`.** New date formatting goes through the helper created in Task 10.
- **Money is stored in integer cents.** One exported constant defines the cap; never hardcode a limit twice.
- **Every task ends with a commit.** Commit messages follow the existing convention: `fix(scope): <imperative summary>`.
- **Verification gate for every task:** `npm run typecheck && npm run lint && npm test` all pass, and `npm run build` passes for any task touching `app/` or `next.config.mjs`.

## Review Focus

These five failure modes are implied by the spec but not directly exercised by most of the tasks below. Each has a pinned test in the task that owns the code.

1. **A signed-in member (not an admin) tampering with an `id` parameter** must never read or write another member's giving, notifications, serve-interest, connect-group or testimony data. Pinned in Task 2 (`services/admin/*` permission assertions) and Task 4.4.
2. **An M-Pesa callback arriving twice, or arriving with an amount/phone that does not match the pending transaction**, must not double-complete the transaction and must not record a mismatched amount. Pinned in Task 3 and Task 4.
3. **Two members sharing one Kenyan family phone number** giving the same amount to the same category must not block each other. Pinned in Task 5.
4. **A crawler requesting a URL that does not exist** must receive HTTP 404, not 200, and must not be indexed. Pinned in Task 9 and Task 11.
5. **Two admins editing the same record in two tabs** — the second save must be rejected with a conflict message, not silently overwrite the first editor's changes. Pinned in Task 4.3.

---

# Wave 1A — Authorization & RLS

### Task 1: Let admins read their own admin row (unblocks all non-SUPER_ADMIN roles)

**Findings:** `#1` · **Severity:** Critical

**Files:**
- Create: `supabase/migrations/0039_admins_self_select.sql`
- Modify: `services/auth.ts:71-74`
- Test: `tests/unit/admin-rbac.test.ts`

**Interfaces:**
- Consumes: existing `public.has_permission(text)` and `public.roles` tables.
- Produces: `public.roles_for_user(p_user_id uuid) returns table (key text)` — a `SECURITY DEFINER` function returning the caller's role keys.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-rbac.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/0039_admins_self_select.sql", "utf8");
const auth = readFileSync("services/auth.ts", "utf8");

describe("admin self-read RBAC", () => {
  it("grants admins SELECT on their own row", () => {
    expect(migration).toMatch(/create policy admins_self_select/i);
    expect(migration).toMatch(/profile_id = auth\.uid\(\)/i);
  });
  it("exposes a SECURITY DEFINER role lookup", () => {
    expect(migration).toMatch(/create or replace function public\.roles_for_user/i);
    expect(migration).toMatch(/security definer/i);
  });
  it("stops reading the admins table through RLS for the session user", () => {
    expect(auth).not.toMatch(/from\("admins"\)\s*\.select\("role:roles\(key\)"\)/);
    expect(auth).toMatch(/rpc\("roles_for_user"/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/admin-rbac.test.ts`
Expected: FAIL — the migration file does not exist.

- [ ] **Step 3: Create the migration**

```sql
-- 0039 — Allow an admin to read their OWN admin row.
-- The admins table policy (0009:admins_admin_all) requires 'roles.manage',
-- which only SUPER_ADMIN holds. Without a self-read policy, ADMIN / EDITOR /
-- PRAYER_MINISTER / MEDIA_MANAGER cannot see their own role row, so
-- getCurrentAdmin() returns null and they are locked out of /admin.

drop policy if exists admins_self_select on public.admins;
create policy admins_self_select on public.admins
  for select to authenticated
  using (profile_id = auth.uid() and is_active = true);

-- Defence in depth: resolve role keys without depending on RLS.
create or replace function public.roles_for_user(p_user_id uuid)
returns table (key text)
language sql
stable
security definer
set search_path = public
as $$
  select r.key
  from public.admins a
  join public.roles r on r.id = a.role_id
  where a.profile_id = p_user_id and a.is_active = true;
$$;

revoke all on function public.roles_for_user(uuid) from public;
grant execute on function public.roles_for_user(uuid) to authenticated;
```

- [ ] **Step 4: Swap the query in `services/auth.ts`**

Replace the `admins` select inside the `Promise.all` in `getCurrentAdmin()` with the RPC:

```ts
const [{ data: profile }, { data: roleRows }, { data: perms }] = await Promise.all([
  supabase
    .from("profiles")
    .select("full_name,avatar_url,phone")
    .eq("id", userId)
    .maybeSingle(),
  supabase.rpc("roles_for_user", { p_user_id: userId }),
  supabase.rpc("permissions_for_user", { p_user_id: userId }),
]);

const roleKeys = (roleRows ?? []).map((r: { key: string }) => r.key).filter(Boolean);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/admin-rbac.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0039_admins_self_select.sql services/auth.ts tests/unit/admin-rbac.test.ts
git commit -m "fix(auth): allow admins to read their own admin row"
```

---

### Task 2: Restore the missing RLS policies on `gallery_items`

**Findings:** `#2` · **Severity:** Critical

> **Scope widened by the controller (2026-10-21).** The original task text covered only the public SELECT policy. On reading the code, the gap is larger: `gallery_items` has **no policy at all**, and the admin gallery write path uses the **session** client — `services/admin/gallery.ts:109` (insert) and `:125` (delete) call `auth.supabase.from("gallery_items")` where `auth.supabase` comes from `createClient()` in `supabase/server.ts`, i.e. the RLS-enforced session client, not the service-role client. So adding and removing photos in the admin gallery is **also** broken, and `services/admin/gallery.read.ts:38` (also the session client) cannot read items belonging to a draft album. The task below restores the whole policy set, mirroring the house pattern that `0009_rls_policies.sql:207-216` already uses for `gallery_albums`.

**Files:**
- Create: `supabase/migrations/0040_gallery_items_policies.sql`
- Test: `tests/unit/gallery-rls.test.ts`

**Interfaces:**
- Consumes: `public.gallery_albums(id, status)`, `public.is_published(public.content_status)` (defined at `0009_rls_policies.sql:30`), `public.has_permission(text)` (defined at `0003_authorization_helpers.sql:45`), `public.gallery_items(album_id, storage_path, caption, alt_text, sort_order, uploaded_by, created_at)`.
- Produces: `gallery_items_public_select`, `gallery_items_admin_select`, `gallery_items_admin_write` policies; column-level grants; `tg_gallery_items_guard_uploaded_by` BEFORE INSERT OR UPDATE trigger.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/gallery-rls.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const m = readFileSync("supabase/migrations/0040_gallery_items_policies.sql", "utf8");

describe("gallery_items policies", () => {
  it("exposes items only via a published album", () => {
    expect(m).toMatch(/create policy gallery_items_public_select/i);
    expect(m).toMatch(/public\.is_published\(a\.status\)/);
  });
  it("grants only the safe columns to the public roles", () => {
    expect(m).toMatch(/grant select \(id, album_id, storage_path, caption, alt_text, sort_order, created_at\)/i);
  });
  it("does not expose uploaded_by through a select grant", () => {
    expect(m).not.toMatch(/grant select \([^)]*uploaded_by/i);
  });
  it("lets media managers read items in draft albums", () => {
    expect(m).toMatch(/create policy gallery_items_admin_select/i);
    expect(m).toMatch(/has_permission\('media\.manage'\)/);
  });
  it("lets media managers insert and delete items", () => {
    expect(m).toMatch(/create policy gallery_items_admin_write/i);
    expect(m).toMatch(/grant insert/i);
    expect(m).toMatch(/grant delete/i);
  });
  it("sets uploaded_by server-side so staff cannot forge it", () => {
    expect(m).toMatch(/new\.uploaded_by := auth\.uid\(\)/);
    expect(m).toMatch(/before insert on public\.gallery_items/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/gallery-rls.test.ts`
Expected: FAIL — file missing.

- [ ] **Step 3: Create the migration**

```sql
-- 0040 — gallery_items had RLS enabled (0009:20) but NO policy of any kind.
--
-- Consequences, both of which are live bugs:
--   1. The public gallery rendered empty — every anon/authenticated read of
--      gallery_items returned zero rows (services/gallery.ts:96-98 and
--      services/content.ts:395).
--   2. The ADMIN gallery was equally broken — services/admin/gallery.ts uses
--      the session client (not the service-role client) for its insert and
--      delete, so adding and removing photos failed, and
--      services/admin/gallery.read.ts could not read items in draft albums.
--
-- The policies below mirror the house pattern that 0009 already applies to
-- gallery_albums (0009_rls_policies.sql:207-216).

-- Public read: an item is visible exactly when its album is visible, so the
-- item policy and the album policy can never disagree.
drop policy if exists gallery_items_public_select on public.gallery_items;
create policy gallery_items_public_select on public.gallery_items
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.gallery_albums a
      where a.id = gallery_items.album_id
        and public.is_published(a.status)
    )
  );

-- Admin read of any album, published or not.
drop policy if exists gallery_items_admin_select on public.gallery_items;
create policy gallery_items_admin_select on public.gallery_items
  for select to authenticated
  using (public.has_permission('media.manage'));

-- Admin write.
drop policy if exists gallery_items_admin_write on public.gallery_items;
create policy gallery_items_admin_write on public.gallery_items
  for all to authenticated
  using (public.has_permission('media.manage'))
  with check (public.has_permission('media.manage'));

-- Column grants. The public roles see only the columns the public UI renders;
-- uploaded_by is a staff-only audit column and stays hidden from anon.
revoke all on table public.gallery_items from anon, authenticated;
grant select (id, album_id, storage_path, caption, alt_text, sort_order, created_at)
  on table public.gallery_items to anon, authenticated;

-- INSERT privilege is required on every column the client names, so
-- uploaded_by must be granted even though the trigger below overwrites it.
-- This is the same pattern as ministry_serve_interests in 0036, which grants
-- insert on profile_id and lets a BEFORE INSERT trigger overwrite it.
-- No UPDATE grant: the app has no update path for gallery items (it inserts
-- and deletes only). DELETE is granted because staff remove photos.
grant insert (album_id, storage_path, caption, alt_text, sort_order, uploaded_by)
  on table public.gallery_items to authenticated;
grant delete
  on table public.gallery_items to authenticated;

-- uploaded_by is set by the database, never by the client. This mirrors the
-- pattern already used for ministry_serve_interests in 0036.
create or replace function public.tg_gallery_items_guard_uploaded_by()
returns trigger
language plpgsql
as $$
begin
  new.uploaded_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists gallery_items_guard_uploaded_by on public.gallery_items;
create trigger gallery_items_guard_uploaded_by
  before insert on public.gallery_items
  for each row execute function public.tg_gallery_items_guard_uploaded_by();
```

> **Column grants and the app's queries.** The public UI selects exactly `id, album_id, storage_path, caption, alt_text, sort_order` (`services/gallery.ts:97`, `services/content.ts:395`) and `id` alone for the count (`services/gallery.ts:112`); the admin read selects `id, album_id, storage_path, caption, alt_text, sort_order, created_at` (`services/admin/gallery.read.ts:39`). All of those columns are granted. `uploaded_by` is granted for INSERT but not for SELECT, so it stays invisible to the public and to the admin UI, and the trigger overwrites whatever the client sent with `auth.uid()`. **The app's insert must keep sending `uploaded_by`** (`services/admin/gallery.ts:112`) — Postgres rejects an INSERT that names a column the role has no INSERT privilege on, so removing it from the grant without removing it from the app would break photo uploads outright.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/gallery-rls.test.ts`
Expected: PASS (6 tests).

Also confirm the new migration parses — `tests/unit/migrations-parse.test.ts` (added in Task 1) parses every file in `supabase/migrations/`, so:

Run: `npx vitest run tests/unit/migrations-parse.test.ts`
Expected: PASS, with 40 of 40 migrations parsed.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0040_gallery_items_policies.sql tests/unit/gallery-rls.test.ts
git commit -m "fix(gallery): restore missing rls policies on gallery items"
```

---

# Wave 1B — Payment Integrity

### Task 3: Enforce the payment transition map on the staff status override

**Findings:** `#3` · **Severity:** Critical

**Files:**
- Modify: `services/admin/giving.actions.ts:52-68`
- Test: `tests/unit/giving-status-override.test.ts`

**Interfaces:**
- Consumes: `canTransition(from, to)` and `isTerminalSuccess(status)` from `lib/payment-transitions.ts` (both already exported — verify names before use).
- Produces: `overrideTransactionStatus(id, status, reason): Promise<AdminActionState>` now rejects illegal transitions.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/giving-status-override.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canStaffTransition, isTerminalSuccess } from "@/lib/payment-transitions";

describe("giving status override", () => {
  it("forbids staff from fabricating a successful payment", () => {
    expect(canStaffTransition("PENDING", "SUCCESS")).toBe(false);
    expect(canStaffTransition("PROCESSING", "SUCCESS")).toBe(false);
  });
  it("forbids reopening a successful transaction", () => {
    expect(isTerminalSuccess("SUCCESS")).toBe(true);
    expect(canStaffTransition("SUCCESS", "PENDING")).toBe(false);
    expect(canStaffTransition("SUCCESS", "PROCESSING")).toBe(false);
    expect(canStaffTransition("SUCCESS", "CANCELLED")).toBe(false);
  });
  it("allows staff to cancel a pending or processing payment", () => {
    expect(canStaffTransition("PENDING", "FAILED")).toBe(true);
    expect(canStaffTransition("PROCESSING", "FAILED")).toBe(true);
    expect(canStaffTransition("PENDING", "CANCELLED")).toBe(true);
  });
  it("allows staff to correct a successful payment", () => {
    expect(canStaffTransition("SUCCESS", "FAILED")).toBe(true);
  });
  it("applies the staff transition check before the service-role update", () => {
    const src = readFileSync("services/admin/giving.actions.ts", "utf8");
    // Anchor on the guard call site, not the bare identifier — the import
    // statement would match "canStaffTransition" and make this assertion
    // pass even if the guard were moved after the write.
    const checkAt = src.indexOf("!canStaffTransition(prior.status");
    const writeAt = src.indexOf(".update({");
    expect(checkAt).toBeGreaterThan(-1);
    expect(checkAt).toBeLessThan(writeAt);
  });
  it("does not resurrect a failed or cancelled payment", () => {
    expect(canStaffTransition("FAILED", "SUCCESS")).toBe(false);
    expect(canStaffTransition("FAILED", "PENDING")).toBe(false);
    expect(canStaffTransition("CANCELLED", "SUCCESS")).toBe(false);
    expect(canStaffTransition("CANCELLED", "PENDING")).toBe(false);
  });
});
```

> **Why a separate map and not `canTransition`:** `canTransition` in `lib/payment-transitions.ts` legitimately allows `PENDING → SUCCESS`, because the **verified M-Pesa callback** is what legitimately completes a payment. The staff override path is different — it is a human writing a status directly. Reusing `canTransition` there would let a staff member fabricate a receipt for an unpaid gift. `canStaffTransition` is a stricter map used only by the override path. **`canTransition` must not be changed** — the callback path depends on it.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/giving-status-override.test.ts`
Expected: FAIL — `canStaffTransition` is not exported from `lib/payment-transitions.ts`.

- [ ] **Step 3a: Add the stricter staff transition map**

In `lib/payment-transitions.ts`, append (do **not** modify the existing `ALLOWED` map or `canTransition`):

```ts
/**
 * Transitions available to the audited staff override path.
 *
 * Deliberately stricter than `ALLOWED`: the provider callback is what
 * legitimately completes a payment, so a human writing a status directly
 * must never be able to mark an unpaid gift as paid. The one exception is
 * SUCCESS -> FAILED, which is a correction of a genuine mistake and is
 * recorded in the audit log with a mandatory reason.
 */
const STAFF_ALLOWED: Record<GivingTxStatus, ReadonlySet<GivingTxStatus>> = {
  PENDING: new Set(["FAILED", "CANCELLED"]),
  PROCESSING: new Set(["FAILED", "CANCELLED"]),
  SUCCESS: new Set(["FAILED"]),
  FAILED: new Set(),
  CANCELLED: new Set(),
};

export function canStaffTransition(from: string, to: string): boolean {
  const allowed = STAFF_ALLOWED[from as GivingTxStatus];
  if (!allowed) return false;
  return allowed.has(to as GivingTxStatus);
}
```

- [ ] **Step 3b: Apply the guard in the staff override action**

In `services/admin/giving.actions.ts`, add the import and insert the check between the `prior` lookup and the update:

```ts
import { canStaffTransition } from "@/lib/payment-transitions";
```

```ts
if (prior.status === parsed.data.status) {
  return { ok: true, message: "Status unchanged." };
}
if (!canStaffTransition(prior.status, parsed.data.status)) {
  return {
    ok: false,
    message: `Cannot move a ${prior.status} transaction to ${parsed.data.status}.`,
  };
}
```

The `reason` field is already mandatory in `OverrideSchema` and is already written to `admin_notes` and `audit_logs.metadata` — the audit trail for a `SUCCESS → FAILED` correction therefore already exists and needs no new work.

- [ ] **Step 4: Add the DB-level backstop**

Create `supabase/migrations/0041_guard_success_transition.sql`:

```sql
-- 0041 — Defense in depth: a completed giving transaction must not be reopened.
--
-- The staff override path (services/admin/giving.actions.ts) runs as service_role
-- and is permitted exactly one correction: SUCCESS -> FAILED, which is written
-- to admin_notes and recorded in audit_logs with a mandatory reason.
-- Every other SUCCESS -> X transition is rejected at the database level, which
-- also blocks a direct PostgREST write made with an admin's own JWT.
create or replace function public.guard_giving_success_transition()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'SUCCESS' and new.status is distinct from 'SUCCESS' then
    if current_setting('request.jwt.claim.role', true) = 'service_role'
       and new.status = 'FAILED' then
      return new;   -- audited correction path
    end if;
    raise exception 'A completed giving transaction cannot be changed from SUCCESS to %', new.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_giving_success_transition on public.giving_transactions;
create trigger trg_guard_giving_success_transition
  before update on public.giving_transactions
  for each row execute function public.guard_giving_success_transition();
```

> **Ruling (human partner, 2026-10-21):** staff **may** correct a `SUCCESS → FAILED` transaction, but only through the service-role path, with a mandatory reason and an audit entry. The database trigger encodes exactly that — service role gets `SUCCESS → FAILED` and nothing else; every other caller is rejected. The application-level `canStaffTransition` map independently prevents a staff member from marking an unpaid gift as `SUCCESS`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/giving-status-override.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/payment-transitions.ts services/admin/giving.actions.ts supabase/migrations/0041_guard_success_transition.sql tests/unit/giving-status-override.test.ts
git commit -m "fix(giving): enforce payment transitions on staff status override"
```

---

### Task 4: Verify the M-Pesa callback amount and account reference, and stop logging the signed URL

**Findings:** `#11`, `#12`, `#16` · **Severity:** High

> **Rewritten by the controller (2026-10-21).** The original task text proposed binding the `CheckoutRequestID` into the HMAC and re-signing the callback URL after Daraja returns it. **That design is architecturally impossible:** Daraja calls back the exact `CallBackURL` that was sent in the STK-push request, so the URL cannot be re-signed afterwards. The original text also proposed changing the signed-message format, which would have had to be applied in **three independent implementations** of `ggc-callback:${transactionId}` — `lib/callback-auth.ts` (Node), `supabase/functions/mpesa-callback/index.ts` (Deno, its own copy), and `supabase/functions/mpesa-stk-push/index.ts` (Deno, inline `crypto.subtle`) — and any mismatch between them silently breaks every payment confirmation. The rewritten task below fixes the real vulnerabilities without touching the signature format.

**Files:**
- Modify: `supabase/functions/mpesa-callback/index.ts`
- Modify: `supabase/functions/mpesa-stk-push/index.ts`
- Test: `tests/unit/mpesa-callback-verification.test.ts`

**Interfaces:**
- Consumes: `giving_transactions.amount_cents` (`bigint`), `giving_transactions.id` (uuid), the STK push's `AccountReference: request.transactionId.slice(0, 12)`.
- Produces: `CallbackPayload.amountCents: number | null` and `CallbackPayload.accountReference: string` in the Edge Function.

**The two vulnerabilities this closes:**

1. **The callback never checks what was actually charged.** `parseCallback` extracts only `CheckoutRequestID` and `ResultCode`; the body's `Amount` and `AccountReference` are discarded. A leaked signed callback URL can therefore mark an **unpaid** transaction `SUCCESS` at any amount the ledger happens to record.
2. **The signed callback URL is written to the Edge Function logs.** `supabase/functions/mpesa-stk-push/index.ts` logs `callbackUrl` verbatim, and that URL contains `?tx=<uuid>&sig=<HMAC>` — the exact secret an attacker needs. Logs are readable by anyone with Supabase project access and are routinely shipped to log-drain vendors.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/mpesa-callback-verification.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const callback = readFileSync("supabase/functions/mpesa-callback/index.ts", "utf8");
const stk = readFileSync("supabase/functions/mpesa-stk-push/index.ts", "utf8");

describe("mpesa callback verification", () => {
  it("extracts the charged amount from the callback body", () => {
    expect(callback).toMatch(/stkCallback\.Amount/);
    expect(callback).toMatch(/amountCents/);
  });
  it("extracts the account reference from the callback body", () => {
    expect(callback).toMatch(/stkCallback\.AccountReference/);
    expect(callback).toMatch(/accountReference/);
  });
  it("reads the stored amount so it can be compared", () => {
    expect(callback).toMatch(/select\([^)]*amount_cents/i);
  });
  it("rejects a successful callback whose amount does not match the ledger", () => {
    expect(callback).toMatch(/amount mismatch/i);
    expect(callback).toMatch(/payload\.amountCents !== Number\(transaction\.amount_cents\)/);
  });
  it("rejects a successful callback whose account reference does not match", () => {
    expect(callback).toMatch(/account reference mismatch/i);
  });
  it("does not log the signed callback url", () => {
    expect(stk).not.toMatch(/console\.log\([^)]*callbackUrl/s);
    expect(stk).toMatch(/transactionId: request\.transactionId/);
  });
  it("normalises the amount to whole shillings before storing it", () => {
    expect(stk).toMatch(/Math\.round\(request\.amountCents \/ 100\) \* 100/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/mpesa-callback-verification.test.ts`
Expected: FAIL — none of these behaviours exist yet.

- [ ] **Step 3: Extract `Amount` and `AccountReference` in the Edge Function**

In `supabase/functions/mpesa-callback/index.ts`, extend the `CallbackPayload` interface:

```ts
interface CallbackPayload {
  externalReference: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  raw: unknown;
  resultCode: number;
  resultDescription: string;
  /** Whole-keshi amount Daraja says it charged, or null when the body omits it. */
  amountCents: number | null;
  /** The AccountReference Daraja echoes back from the STK push. */
  accountReference: string;
}
```

In `parseCallback`, alongside the existing `checkoutRequestID` extraction:

```ts
const amountRaw = stkCallback.Amount;
const amountNumber = typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
const amountCents =
  amountRaw === undefined || amountRaw === null || Number.isNaN(amountNumber)
    ? null
    : Math.round(amountNumber * 100);

const accountReference =
  typeof stkCallback.AccountReference === "string" ? stkCallback.AccountReference : "";
```

and return both from `parseCallback`.

> **`amountCents` must be `number | null`, not `number`.** `Amount` is absent from some Daraja error responses, and `Number(undefined)` is `NaN` — a NaN comparison against `amount_cents` would always be false, silently passing the check. `null` makes "amount missing" distinguishable from "amount is zero".

- [ ] **Step 4: Select `amount_cents` and fail closed on a mismatched SUCCESS**

In the transaction lookup in the same file, add the column:

```ts
.select("id, status, provider, external_reference, amount_cents")
```

Then, **immediately after the existing CheckoutRequestID mismatch check and before the `transaction.status === "SUCCESS"` early return**, add:

```ts
// A SUCCESS callback must prove what was actually charged and which
// account reference it was sent for. Without these two checks a leaked
// signed callback URL can mark an unpaid transaction as paid at any amount.
//
// Failures are deliberately NOT gated on these: Daraja omits Amount and
// AccountReference on some error responses, and refusing those would leave
// genuinely failed transactions stuck in PROCESSING.
if (finalStatus === "SUCCESS") {
  if (payload.amountCents === null) {
    console.error("Callback missing Amount for transaction", txId);
    return jsonResponse({ error: "Callback missing Amount" }, 400);
  }
  if (payload.amountCents !== Number(transaction.amount_cents)) {
    console.error("Amount mismatch for transaction", txId);
    return jsonResponse({ error: "Amount mismatch" }, 400);
  }
  const expectedReference = transaction.id.slice(0, 12);
  if (!payload.accountReference || payload.accountReference !== expectedReference) {
    console.error("Account reference mismatch for transaction", txId);
    return jsonResponse({ error: "Account reference mismatch" }, 400);
  }
}
```

> **Placement note.** `finalStatus` is `payload.status`. The check must sit **before** the update and **after** the transaction row is available. Putting it before the `transaction.status === "SUCCESS"` early return means a replayed callback with a wrong amount is rejected even when the transaction is already marked successful.

- [ ] **Step 5: Stop logging the signed callback URL**

In `supabase/functions/mpesa-stk-push/index.ts`, the `console.log("Sending Daraja STK Push:", {...})` object currently includes `callbackUrl`. That URL contains `?tx=<uuid>&sig=<HMAC>`.

Replace it with:

```ts
console.log("Sending Daraja STK Push:", {
  environment: config.environment,
  shortcode: config.shortcode,
  amount,
  phone: `${phone.slice(0, 6)}******`,
  transactionId: request.transactionId,
  timestamp,
});
```

Then grep the whole file for any other `console.log` or `console.error` that includes `callbackUrl`, `sig`, or `signature`, and remove the secret from those too.

- [ ] **Step 6: Normalise the amount so the ledger and the charge cannot disagree**

Daraja charges whole shillings. Today `stkPushLive` sends `Math.round(request.amountCents / 100)` to Daraja, but the insert writes the raw `request.amountCents` — so a 100.50 KES gift is recorded as 10050 cents while the donor is charged 101.00.

In `supabase/functions/mpesa-stk-push/index.ts`, in the handler that owns both the insert and the STK call, normalise **once**, before either use:

```ts
// Daraja charges whole shillings. Normalise once so the ledger and the
// charge can never disagree by a fraction.
const amountCents = Math.round(request.amountCents / 100) * 100;
```

Use `amountCents` in the `giving_transactions` insert (replacing the current `amount_cents: amountCents` value that holds the un-normalised number), and change `stkPushLive` to send the exact amount:

```ts
Amount: request.amountCents / 100,
```

`request.amountCents / 100` is then an exact integer, because the value was already normalised to a multiple of 100.

> **Scope note:** the normalisation belongs in the Edge Function because the Edge Function owns the insert. `services/giving.actions.ts` sends `amount * 100` to the function, and the function normalises it, so the row that lands in the database is correct. The app's own pre-flight validation is a separate concern handled by Task 7.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/unit/mpesa-callback-verification.test.ts`
Expected: PASS (7 tests).

Also confirm nothing regressed:

Run: `npx vitest run tests/unit/mpesa-provider.test.ts tests/unit/mpesa-sandbox-readiness.test.ts tests/unit/payment-provider.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/mpesa-callback/index.ts supabase/functions/mpesa-stk-push/index.ts tests/unit/mpesa-callback-verification.test.ts
git commit -m "fix(payments): verify callback amount and account reference, stop logging signed url"
```

---


### Task 5: Fix the idempotency-key collision and release the key on failure

**Findings:** `#10`, `#15` · **Severity:** Critical

> **Corrected by the controller (2026-10-21).** The original task text proposed including the `transactionId` in the idempotency key. That is a chicken-and-egg: the key is the `external_reference` value written **into** the row, and the row's `id` is generated by the database (`default gen_random_uuid()`) and only known **after** the insert. The key is therefore made unique with a random UUID instead, which achieves the same goal — no two requests can ever produce the same key.

**Files:**
- Modify: `supabase/functions/mpesa-stk-push/index.ts`
- Create: `supabase/migrations/0042_relax_external_reference_unique.sql`
- Test: `tests/unit/giving-idempotency.test.ts`

**Interfaces:**
- Consumes: `giving_transactions.external_reference` (unique per `(provider, external_reference)` via `idx_giving_tx_external_ref`), the authenticated caller's `user.id`.
- Produces: `generateIdempotencyKey(categoryId, amountCents, phone, userId): string` — unique per request.

**The two live bugs this closes:**

1. **The key collides across users on a shared phone number.** Today it is `${categoryId}|${amountCents}|${phone}|${5-minute-bucket}` — it does not include the user. Two members of one household giving the same amount to the same category within five minutes produce the *identical* key, and the second insert violates `idx_giving_tx_external_ref` and fails with a generic "Could not initiate giving".
2. **The key is never released on failure.** The row is inserted with the key *before* the Daraja call. If that call throws, the row stays `PENDING` holding the key. The reuse lookup only self-heals for the *same* user, so a different user on the same phone number is permanently blocked.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/giving-idempotency.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const fn = readFileSync("supabase/functions/mpesa-stk-push/index.ts", "utf8");
const migration = readFileSync("supabase/migrations/0042_relax_external_reference_unique.sql", "utf8");

describe("giving idempotency", () => {
  it("includes the user id in the idempotency key", () => {
    expect(fn).toMatch(/function generateIdempotencyKey\([^)]*userId/s);
  });
  it("makes the key unique per request rather than per time bucket", () => {
    expect(fn).toMatch(/randomUUID\(\)/);
    expect(fn).not.toMatch(/Math\.floor\(Date\.now\(\) \/ \(5 \* 60 \* 1000\)\)/);
  });
  it("releases the key when the provider call fails", () => {
    expect(fn).toMatch(/external_reference: null/);
  });
  it("does not apply the unique index to temp keys", () => {
    expect(migration).toMatch(/not like '%\|%'/);
  });
  it("still uses the normalised amount in the key", () => {
    expect(fn).toMatch(/generateIdempotencyKey\(\s*categoryId,\s*normalizedAmountCents/s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/giving-idempotency.test.ts`
Expected: FAIL — the migration file does not exist and the key is still bucketed.

- [ ] **Step 3: Make the key unique per request**

In `supabase/functions/mpesa-stk-push/index.ts`, replace the whole `generateIdempotencyKey` function:

```ts
function generateIdempotencyKey(
  categoryId: string,
  amountCents: number,
  phone: string,
  userId: string,
): string {
  // Unique per request. The previous 5-minute time bucket collided across
  // users on a shared phone number and permanently blocked retries, because
  // the row that reserved the key was never cleaned up.
  //
  // The `|` separator marks this as a temporary key rather than a real
  // provider reference; the callback relies on that marker.
  return `${categoryId}|${amountCents}|${phone}|${userId}|${crypto.randomUUID()}`;
}
```

`crypto.randomUUID()` is already used elsewhere in this file (`stkPushMock`), so no import is needed.

Update the call site to pass the user id, and keep the normalised amount:

```ts
const idempotencyKey = generateIdempotencyKey(
  categoryId,
  normalizedAmountCents,
  normalizedPhone,
  user.id,
);
```

`user` is already in scope at that point — it is resolved before this line (the reuse lookup above it filters on `created_by: user.id`).

- [ ] **Step 4: Release the key when the provider call fails**

The row is inserted with the key before the Daraja call. Wrap that call so a failure releases the reservation instead of leaving a `PENDING` row holding the key.

`supabase` and `transactionId` are both in scope inside the main `try` block (`supabase` is created at line 381, `transactionId` is assigned by the insert), so the wrapper goes around the call itself — **not** in the outer `catch`, where neither is in scope.

Replace:

```ts
const result = isMockMode(config)
  ? stkPushMock(request)
  : await stkPushLive(
      config,
      request,
      callbackUrl,
    );
```

with:

```ts
let result: StkPushResult;
try {
  result = isMockMode(config)
    ? stkPushMock(request)
    : await stkPushLive(
        config,
        request,
        callbackUrl,
      );
} catch (error) {
  console.error("Daraja STK push failed:", error);

  // Release the reserved idempotency key. Without this the row stays PENDING
  // holding the key forever, and the unique index blocks the member's retry.
  await supabase
    .from("giving_transactions")
    .update({ status: "FAILED", external_reference: null })
    .eq("id", transactionId);

  return new Response(
    JSON.stringify({
      error: "Could not initiate giving",
    }),
    {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
}
```

Confirm the `StkPushResult` type name is the one this file actually declares — read the type declaration near the top of the file and use it exactly. If the result is declared with `const` elsewhere, adjust the wrapper to match the existing style rather than inventing a new type.

> **Note:** `external_reference: null` releases the key. The row is left at `FAILED` rather than deleted so the attempt remains auditable.

- [ ] **Step 5: Relax the unique index so temporary keys are never subject to it**

Create `supabase/migrations/0042_relax_external_reference_unique.sql`:

```sql
-- 0042 — The unique index on (provider, external_reference) also applied to
-- the temporary idempotency key that mpesa-stk-push writes before the Daraja
-- call returns. A temporary key is not a provider reference and must never be
-- subject to provider-reference uniqueness; the real CheckoutRequestID that
-- replaces it is unique in its own right.
drop index if exists public.idx_giving_tx_external_ref;
create unique index idx_giving_tx_external_ref
  on public.giving_transactions(provider, external_reference)
  where external_reference is not null
    and external_reference not like '%|%';
```

The `%|%` sentinel is already relied on in two places: `supabase/functions/mpesa-callback/index.ts` (the `isTempIdempotencyKey` check) and `services/giving.ts` (the callback lookup). This migration makes the database agree with the convention the code already uses.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/unit/giving-idempotency.test.ts`
Expected: PASS (5 tests).

Also confirm the Edge Function still parses — `tests/unit/edge-functions-parse.test.ts` (added in Task 4) checks every file under `supabase/functions/`:

Run: `npx vitest run tests/unit/edge-functions-parse.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/mpesa-stk-push/index.ts supabase/migrations/0042_relax_external_reference_unique.sql tests/unit/giving-idempotency.test.ts
git commit -m "fix(giving): make idempotency key unique per request and release on failure"
```

---

### Task 6: Add a reaper for stale giving transactions

**Findings:** `#9` · **Severity:** Critical

**Files:**
- Create: `supabase/migrations/0043_giving_reaper.sql`
- Test: `tests/unit/giving-reaper.test.ts`

**Interfaces:**
- Consumes: `giving_transactions.status` (`public.giving_tx_status`), `giving_transactions.updated_at`.
- Produces: `public.expire_stale_giving_transactions() returns integer` (a `SECURITY DEFINER` function granted to `service_role`), scheduled every 10 minutes by `pg_cron` under the job name `expire-giving-transactions`.
- **`lib/payment-transitions.ts` is NOT modified.** The existing `ALLOWED` map already permits `PENDING → FAILED` and `PROCESSING → FAILED`; no change is needed and none is in scope.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/giving-reaper.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canTransition } from "@/lib/payment-transitions";

const m = readFileSync("supabase/migrations/0043_giving_reaper.sql", "utf8");

describe("giving reaper", () => {
  it("allows PROCESSING to FAILED", () => {
    expect(canTransition("PROCESSING", "FAILED")).toBe(true);
  });
  it("allows PENDING to FAILED", () => {
    expect(canTransition("PENDING", "FAILED")).toBe(true);
  });
  it("expires stale transactions after 30 minutes", () => {
    expect(m).toMatch(/interval '30 minutes'/);
  });
  it("never expires a successful transaction", () => {
    expect(m).toMatch(/status in \('PENDING','PROCESSING'\)/);
  });
  it("schedules the reaper with pg_cron", () => {
    expect(m).toMatch(/cron\.schedule\(/);
    expect(m).toMatch(/'expire-giving-transactions'/);
    expect(m).toMatch(/'\*\/10 \* \* \* \*'/);
  });
  it("passes the cron command as a single-quoted string, not a dollar quote", () => {
    // A dollar-quoted string nested inside the dollar-quoted DO body closes
    // the body early and the migration fails to parse.
    expect(m).toMatch(/'select public\.expire_stale_giving_transactions\(\);'/);
    expect(m).not.toMatch(/\$\$select public\.expire_stale_giving_transactions\(\);\$\$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/giving-reaper.test.ts`
Expected: FAIL.

- [ ] **Step 3: Verify the transition map already permits the expiry transition**

The existing `ALLOWED` map in `lib/payment-transitions.ts` already contains `FAILED` as a target from both `PENDING` and `PROCESSING`:

```ts
PENDING: new Set(["PROCESSING", "SUCCESS", "FAILED", "CANCELLED"]),
PROCESSING: new Set(["SUCCESS", "FAILED", "CANCELLED"]),
```

**No change to `lib/payment-transitions.ts` is required.** The Step 1 assertions on `canTransition("PROCESSING", "FAILED")` and `canTransition("PENDING", "FAILED")` are therefore **regression guards that already pass** — they are not the failing part of the test. The failing assertion is the one that reads `supabase/migrations/0043_giving_reaper.sql`, which does not exist yet.

Do **not** modify the `ALLOWED` map. Task 3 added a separate `STAFF_ALLOWED` map for the staff path; that is where the transition rules live.

- [ ] **Step 4: Create the migration**

```sql
-- 0043 — Expire giving transactions whose Daraja callback never arrived.
-- Without this, a lost callback leaves the row PROCESSING forever and the
-- donor sees "Processing" indefinitely.
create or replace function public.expire_stale_giving_transactions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.giving_transactions
     set status = 'FAILED',
         admin_notes = coalesce(admin_notes, 'Expired: no payment confirmation received within 30 minutes.'),
         updated_at = now()
   where status in ('PENDING','PROCESSING')
     and updated_at < now() - interval '30 minutes';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_stale_giving_transactions() from public;
grant execute on function public.expire_stale_giving_transactions() to service_role;

-- Fire every 10 minutes via pg_cron (Supabase enables pg_cron by default).
-- The command string MUST be single-quoted here: a dollar-quoted string
-- nested inside this dollar-quoted body closes the body early and the
-- migration fails to parse.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'expire-giving-transactions',
      '*/10 * * * *',
      'select public.expire_stale_giving_transactions();'
    );
  end if;
end $$;
```

> If `pg_cron` is not enabled on the project, run the equivalent from Supabase's scheduled Edge Function instead: `supabase/functions/giving-reaper/index.ts` invoking the same RPC every 10 minutes.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/giving-reaper.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/payment-transitions.ts supabase/migrations/0043_giving_reaper.sql tests/unit/giving-reaper.test.ts
git commit -m "fix(giving): expire stale giving transactions"
```

---

### Task 7: Unify the donation cap into one exported constant

**Findings:** `#15` · **Severity:** High

**Files:**
- Create: `lib/giving-limits.ts`
- Modify: `services/giving.actions.ts:11-14`, `services/giving.ts:56`, `app/give/_components/GivingForm.tsx:186-194`
- Test: `tests/unit/giving-limits.test.ts`

**Interfaces:**
- Produces: `MAX_GIFT_CENTS = 10_000_000` (KES 100,000) and `MAX_GIFT_SHILLINGS = 100_000`, exported from `lib/giving-limits.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/giving-limits.test.ts
import { describe, expect, it } from "vitest";
import { MAX_GIFT_CENTS, MAX_GIFT_SHILLINGS } from "@/lib/giving-limits";

describe("giving limits", () => {
  it("agrees between cents and shillings", () => {
    expect(MAX_GIFT_CENTS).toBe(MAX_GIFT_SHILLINGS * 100);
  });
  it("is 100,000 KES", () => {
    expect(MAX_GIFT_SHILLINGS).toBe(100_000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/giving-limits.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `lib/giving-limits.ts`**

```ts
export const MAX_GIFT_SHILLINGS = 100_000;
export const MAX_GIFT_CENTS = MAX_GIFT_SHILLINGS * 100;
export const MIN_GIFT_SHILLINGS = 1;
export const MIN_GIFT_CENTS = MIN_GIFT_SHILLINGS * 100;
```

- [ ] **Step 4: Use the constant in all three places**

`services/giving.actions.ts`:
```ts
amount: z.coerce.number()
  .positive("Amount must be greater than zero.")
  .max(MAX_GIFT_SHILLINGS, "Maximum gift is KES 100,000."),
```

`services/giving.ts:56`:
```ts
if (input.amountCents < MIN_GIFT_CENTS || input.amountCents > MAX_GIFT_CENTS) { ... }
```

`app/give/_components/GivingForm.tsx` — add `max={MAX_GIFT_SHILLINGS}` to the amount `<Input>` (it currently has `min={1}` but no `max`). The field-level error plumbing **already exists** — the amount `<Field>` already renders `error={state.errors?.amount}` and the input already sets `aria-invalid={Boolean(state.errors?.amount)}` (`GivingForm.tsx:183,193`). Do not restructure that; only add the `max` attribute.

**The Edge Function keeps its own literal.** `supabase/functions/mpesa-stk-push/index.ts:442` already caps at `amountCents > 10_000_000`, which equals `MAX_GIFT_CENTS`. It **cannot** import from `lib/giving-limits.ts` — a Supabase Edge Function bundles only its own directory, and `lib/` is outside it. Leave the literal in place, but add a comment naming the source of truth so the two cannot silently drift:

```ts
// Keep in sync with MAX_GIFT_CENTS in lib/giving-limits.ts — the Edge
// Function bundle cannot import from the app's lib/ directory.
amountCents > 10_000_000 ||
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/giving-limits.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/giving-limits.ts services/giving.actions.ts services/giving.ts app/give/_components/GivingForm.tsx tests/unit/giving-limits.test.ts
git commit -m "fix(giving): unify donation cap across schema, service and form"
```

---

# Wave 1C — SEO & Accessibility Foundations

### Task 8: Ship a real default OG image and fix the homepage title

**Findings:** `#4`, `#8` · **Severity:** Critical

**Files:**
- Create: `app/opengraph-image.tsx`
- Modify: `lib/seo.ts:3-4, 67-120`, `app/page.tsx:24-33`
- Test: `tests/unit/seo.test.ts` (extend)

**Interfaces:**
- Produces: `resolveSiteUrl(): string` in `lib/seo.ts`; `buildPageMetadata` accepts `absoluteTitle?: boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// appended to tests/unit/seo.test.ts
import { buildPageMetadata } from "@/lib/seo";

describe("site url and absolute titles", () => {
  it("throws in production when NEXT_PUBLIC_SITE_URL is missing", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    const prevNode = process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NODE_ENV = "production";
    expect(() => require("@/lib/seo").resolveSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    process.env.NEXT_PUBLIC_SITE_URL = prev;
    process.env.NODE_ENV = prevNode;
  });

  it("produces an absolute title when asked", () => {
    const m = buildPageMetadata({ title: "Glorious Gospel Centre Church", absoluteTitle: true, path: "/" });
    expect(m.title).toEqual({ absolute: "Glorious Gospel Centre Church" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: FAIL — `resolveSiteUrl` is not exported and `absoluteTitle` is not supported.

- [ ] **Step 3: Make the site URL fail loudly in production**

In `lib/seo.ts`, replace the top-level constant:

```ts
export function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set in production — canonical URLs, Open Graph tags and the sitemap would otherwise point at localhost.",
    );
  }
  return "http://localhost:3000";
}
const SITE_URL = resolveSiteUrl();
```

- [ ] **Step 4: Support absolute titles**

In `lib/seo.ts`, extend the input interface and `buildPageMetadata`:

```ts
export interface PageSeoInput {
  title: string;
  /** Use title.absolute — required for the root page, where the layout template does not apply. */
  absoluteTitle?: boolean;
  // ... existing fields
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const title = input.absoluteTitle ? { absolute: input.title } : input.title;
  return { title, /* ...rest unchanged */ };
}
```

- [ ] **Step 5: Create the OG image route**

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Glorious Gospel Centre Church";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#062B87",
          color: "white",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontSize: 64,
          fontWeight: 700,
          textAlign: "center",
          padding: 60,
        }}
      >
        Glorious Gospel Centre Church
        <div style={{ fontSize: 30, fontWeight: 400, marginTop: 20, opacity: 0.9 }}>
          Worship · Community · Teaching · Outreach
        </div>
      </div>
    ),
    size,
  );
}
```

Remove `DEFAULT_OG_IMAGE` from `lib/seo.ts` and let the file convention supply `og:image`. Keep `DEFAULT_OG_IMAGE` only as a *fallback* for pages that set an explicit `image` — otherwise delete it and its two usages (`:24`, `:69`).

- [ ] **Step 6: Fix the homepage title**

In `app/page.tsx:24-33`:

```ts
return buildPageMetadata({
  title:
    settings.seo_default_title ??
    "Glorious Gospel Centre Church — Worship, Community, Teaching & Outreach",
  absoluteTitle: true,
  description: ...,
  path: "/",
  imageAlt: settings.church_name,
  keywords: [...],
});
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify the rendered output**

Run: `npm run build && npm run start` then `curl -s http://localhost:3000/ | grep -E '<title>|og:image'`
Expected: `<title>Glorious Gospel Centre Church — Worship, Community, Teaching & Outreach</title>` and an `og:image` pointing at `/opengraph-image` (not `/og-default.svg`).

- [ ] **Step 9: Commit**

```bash
git add app/opengraph-image.tsx lib/seo.ts app/page.tsx tests/unit/seo.test.ts
git commit -m "fix(seo): ship default og image and absolute homepage title"
```

---

### Task 9: Return real 404s for unknown URLs

**Findings:** `#5`, `#6` · **Severity:** Critical

**Files:**
- Modify: `app/loading.tsx` (delete or scope), `app/ministries/[slug]/page.tsx:74`
- Create: `app/not-found.tsx` metadata addition
- Test: `tests/unit/not-found-behaviour.test.ts`

**Interfaces:**
- Produces: HTTP 404 for every unmatched dynamic route.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/not-found-behaviour.test.ts
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("not found behaviour", () => {
  it("does not have a root loading.tsx that flushes a 200 shell", () => {
    expect(existsSync("app/loading.tsx")).toBe(false);
  });
  it("ministries slug calls notFound()", () => {
    const src = readFileSync("app/ministries/[slug]/page.tsx", "utf8");
    expect(src).toMatch(/if \(!ministry\) notFound\(\)/);
    expect(src).not.toMatch(/if \(!ministry\) return null/);
  });
  it("the 404 page is not indexable", () => {
    const src = readFileSync("app/not-found.tsx", "utf8");
    expect(src).toMatch(/index: false/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/not-found-behaviour.test.ts`
Expected: FAIL — `app/loading.tsx` exists and ministries returns `null`.

- [ ] **Step 3: Move the loading skeleton out of the root**

Delete `app/loading.tsx`. Add route-level `loading.tsx` files to the segments that benefit from streaming — at minimum `app/sermons/loading.tsx`, `app/events/loading.tsx`, `app/gallery/loading.tsx`, `app/account/loading.tsx`, `app/admin/(protected)/loading.tsx` — each a copy of the existing skeleton.

> **Critical:** do **not** add `app/loading.tsx` back at the root. A root `loading.tsx` creates the Suspense boundary that flushes HTTP 200 before `notFound()` can set the status.

- [ ] **Step 4: Make the ministries route call `notFound()`**

In `app/ministries/[slug]/page.tsx`:

```ts
import { notFound } from "next/navigation";
// ...
const ministry = await getMinistryBySlug(params.slug);
if (!ministry) notFound();
```

- [ ] **Step 5: Make the 404 page non-indexable**

In `app/not-found.tsx` add:

```tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
```

- [ ] **Step 6: Verify with a production build**

Run: `npm run build && npm run start`
Then: `for p in events/nope sermons/nope ministries/nope gallery/nope; do echo -n "/$p -> "; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/$p; done`
Expected: `404` for all four.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/unit/not-found-behaviour.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A app/loading.tsx app/ministries/\[slug\]/page.tsx app/not-found.tsx app/sermons/loading.tsx app/events/loading.tsx app/gallery/loading.tsx app/account/loading.tsx tests/unit/not-found-behaviour.test.ts
git commit -m "fix(routing): return real 404s for unknown urls"
```

---

### Task 10: Give every public page exactly one `<h1>`

**Findings:** `#7`, `#29`, `#35` · **Severity:** Critical

**Files:**
- Modify: `components/ui/PageHeader.tsx:44-46`, `components/ui/Section.tsx:13-24`
- Create: `lib/dates.ts`
- Modify: `app/about/story/page.tsx`, `app/about/vision-mission/page.tsx`, `app/about/statement-of-faith/page.tsx`
- Test: `tests/unit/page-headings.test.ts`, `tests/unit/dates.test.ts`

**Interfaces:**
- Produces: `formatKenyaDate(iso)`, `formatKenyaDateTime(iso)` in `lib/dates.ts` — always `Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi" })`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/page-headings.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("page headings", () => {
  it("PageHeader renders an h1 by default", () => {
    const src = readFileSync("components/ui/PageHeader.tsx", "utf8");
    expect(src).toMatch(/SectionTitle as="h1"/);
  });
  it("CmsPageView pages pass hideTitle to avoid two h1s", () => {
    for (const p of ["story", "vision-mission", "statement-of-faith"]) {
      const src = readFileSync(`app/about/${p}/page.tsx`, "utf8");
      expect(src).toMatch(/hideTitle/);
    }
  });
});
```

```ts
// tests/unit/dates.test.ts
import { describe, expect, it } from "vitest";
import { formatKenyaDate, formatKenyaDateTime } from "@/lib/dates";

describe("kenya dates", () => {
  it("renders a date-only column without shifting a day", () => {
    expect(formatKenyaDate("2024-01-15")).toContain("15");
  });
  it("formats a timestamp in Nairobi time", () => {
    expect(formatKenyaDateTime("2026-10-21T22:00:00Z")).toContain("22");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/page-headings.test.ts tests/unit/dates.test.ts`
Expected: FAIL.

- [ ] **Step 3: Make `PageHeader` render an `<h1>`**

In `components/ui/PageHeader.tsx`:

```tsx
<SectionTitle as="h1" className={align === "center" ? undefined : "text-left"}>
  {title}
</SectionTitle>
```

`components/ui/Section.tsx` already styles `h1` via `heading-1`, so no visual change is needed beyond confirming the token exists.

- [ ] **Step 4: Prevent double `<h1>` on the CMS pages**

`app/about/story/page.tsx`, `app/about/vision-mission/page.tsx` and `app/about/statement-of-faith/page.tsx` render both `PageHeader` and `CmsPageView`. Pass `hideTitle` to `CmsPageView` on all three (matching what `app/privacy/page.tsx:40` already does).

- [ ] **Step 5: Create `lib/dates.ts`**

```ts
export const KENYA_TZ = "Africa/Nairobi";

const dateFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: KENYA_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: KENYA_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** For Postgres `date` columns — format the YYYY-MM-DD string directly so it never shifts a day. */
export function formatKenyaDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return dateFmt.format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
  }
  return dateFmt.format(new Date(value));
}

export function formatKenyaDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return dateTimeFmt.format(new Date(value));
}
```

- [ ] **Step 6: Replace every implicit-locale date call**

Replace `new Date(x).toLocaleDateString(...)` / `toLocaleString(...)` with the helpers in:
`app/account/_components/AccountGivingSection.tsx:69`, `app/account/_components/AccountNotificationsSection.tsx:47`, `app/connect/[slug]/_components/ConnectGroupMembershipPanel.tsx:110`, `app/admin/(protected)/giving/page.tsx:89`, `app/admin/(protected)/giving/[id]/page.tsx:70,74`, `app/admin/(protected)/messages/_components/MessageRow.tsx:28`, `app/admin/(protected)/approvals/_components/ApprovalQueue.tsx:128`, `app/admin/(protected)/testimonies/_components/TestimonyRow.tsx:59,75`, `app/admin/(protected)/connect-groups/[id]/members/_components/MembershipRow.tsx:51,64,66`, `app/admin/(protected)/prayer-requests/_components/PrayerRow.tsx:46`, `app/sermons/page.tsx:31`, `app/sermons/[slug]/page.tsx:54`, `app/events/page.tsx:29-35`, `app/events/[slug]/page.tsx:48`, `app/gallery/page.tsx:29`, `app/gallery/[album]/page.tsx:50`, `components/home/ThisWeekSection.tsx:19`, `components/home/LatestSermonSection.tsx:13`, `app/admin/(protected)/audit/page.tsx:43`.

For the 7 **client** components, the server/client locale mismatch must also be avoided: `formatKenyaDate` is deterministic, so it is safe to call during SSR *provided* it is not passed through `toLocale*`. Using the explicit `Intl.DateTimeFormat` above makes server and client output identical.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run tests/unit/page-headings.test.ts tests/unit/dates.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify heading counts**

Run: `npm run build && npm run start`, then for each of `/about`, `/give`, `/prayer`, `/visit`, `/services`, `/contact`, `/events`, `/sermons` run `curl -s http://localhost:3000<path> | grep -c '<h1'`.
Expected: `1` for every page.

- [ ] **Step 9: Commit**

```bash
git add components/ui/PageHeader.tsx components/ui/Section.tsx lib/dates.ts app/ tests/unit/page-headings.test.ts tests/unit/dates.test.ts
git commit -m "fix(a11y): give every public page one h1 and pin dates to Africa/Nairobi"
```

---

### Task 11: Complete the structured data for local SEO

**Findings:** `#4`, `#7`, SEO-M1-#M8 · **Severity:** High

**Files:**
- Modify: `lib/seo.ts`, `app/layout.tsx:99-109`, `app/visit/page.tsx`, `components/about/CmsPageView.tsx`
- Create: `supabase/migrations/0044_site_settings_locality.sql`
- Test: `tests/unit/seo.test.ts` (extend)

**Interfaces:**
- Produces: `buildChurchSchema` gains `sameAs`, `geo`, `openingHoursSpecification`, `addressLocality`/`addressRegion`/`postalCode`; new `buildFaqSchema`, `buildPersonSchema`, `buildWebSiteSchema`.

- [ ] **Step 1: Write the failing test**

```ts
// appended to tests/unit/seo.test.ts
import { buildChurchSchema, buildFaqSchema } from "@/lib/seo";

describe("local seo schema", () => {
  it("emits sameAs and opening hours for the church", () => {
    const s = buildChurchSchema({
      name: "GGCC",
      description: "d",
      url: "https://example.org",
      sameAs: ["https://facebook.com/ggcc"],
      openingHours: [{ day: "Sunday", opens: "08:00" }],
    });
    expect(s.sameAs).toEqual(["https://facebook.com/ggcc"]);
    expect((s.openingHoursSpecification as unknown[])[0]).toMatchObject({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
    });
  });
  it("emits a valid FAQPage", () => {
    const s = buildFaqSchema([{ question: "q", answer: "a" }]);
    expect(s["@type"]).toBe("FAQPage");
    expect((s.mainEntity as unknown[])[0]).toMatchObject({ "@type": "Question" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: FAIL — `sameAs`/`openingHours` not supported, `buildFaqSchema` does not exist.

- [ ] **Step 3: Extend the `site_settings` table**

Create `supabase/migrations/0044_site_settings_locality.sql`:

```sql
-- 0044 — Local SEO fields for the Church schema.
alter table public.site_settings
  add column if not exists locality text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
```

- [ ] **Step 4: Extend `buildChurchSchema`**

Add the fields to the `ChurchSchemaInput` interface and the emitted object per the audit's exact shape — `sameAs` (array), `geo` (`GeoCoordinates`), `openingHoursSpecification` (array of `OpeningHoursSpecification`), and split `addressLocality`/`addressRegion`/`postalCode`.

**Delete** the latent bug at `lib/seo.ts:166`:
```ts
...(input.timezone ? { openingHoursSpecification: input.timezone } : {}),
```
`openingHoursSpecification` must never receive a timezone string. **Also remove the `timezone?: string` field from `ChurchSchemaInput`** — it exists only to feed that bug, and `app/layout.tsx` never passes it. Leaving it in place invites the bug to be reintroduced.

**Keep** `buildChurchSchema`'s existing required fields (`name`, `description`, `url`) and all existing optional fields (`logoUrl`, `imageUrl`, `telephone`, `email`, `address`) unchanged — `app/layout.tsx:99-109` calls it with exactly those today and must keep compiling.

- [ ] **Step 5: Wire the data in `app/layout.tsx`**

Pass `sameAs` from `getActiveSocialLinks()` and `openingHours` derived from `getPublishedServices()`. Extend the `SiteSettings` type in `types/content.ts` with the new columns.

- [ ] **Step 6: Add `FAQPage` to `/visit`**

The 7 FAQ items already exist in `app/visit/page.tsx:88-135`. Render `<JsonLd data={buildFaqSchema(...)} />` alongside them.

- [ ] **Step 7: Add `Person` schema for leaders**

In `components/about/CmsPageView.tsx`, render one `<JsonLd data={buildPersonSchema({...})} />` per leader in `LeaderGrid`, with `worksFor: { "@id": "<siteUrl>/#church" }`.

- [ ] **Step 8: Add `offers` to the Event schema**

In `lib/seo.ts` `buildEventSchema`, add:
```ts
offers: {
  "@type": "Offer",
  price: 0,
  priceCurrency: "KES",
  availability: "https://schema.org/InStock",
  url: input.url,
  validFrom: input.startDate,
},
```
and give `location` a `PostalAddress` and `geo`.

- [ ] **Step 9: Add `thumbnailUrl` to the VideoObject**

In `app/sermons/[slug]/page.tsx`, pass `sermon.thumbnail_url ?? youtubeThumbnailUrl(sermon.video_url)` — the helper already exists at `lib/media.ts:94`.

- [ ] **Step 10: Run test to verify it passes**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add lib/seo.ts app/layout.tsx app/visit/page.tsx app/sermons/\[slug\]/page.tsx components/about/CmsPageView.tsx types/content.ts supabase/migrations/0044_site_settings_locality.sql tests/unit/seo.test.ts
git commit -m "feat(seo): complete local business and content structured data"
```

---

# Wave 1D — Hardening

### Task 12: Enforce a CSP with nonces and restrict Storage uploads

**Findings:** `#13`, `#14` · **Severity:** High

**Files:**
- Modify: `next.config.mjs:38-54`, `middleware.ts`
- Create: `supabase/migrations/0045_storage_content_types.sql`
- Test: `tests/unit/security-hardening.test.ts` (extend)

**Interfaces:**
- Produces: `middleware.ts` sets an `x-nonce` request header; `next.config.mjs` reads it for the enforced `Content-Security-Policy`.

- [ ] **Step 1: Write the failing test**

```ts
// appended to tests/unit/security-hardening.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const config = readFileSync("next.config.mjs", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");
const storage = readFileSync("supabase/migrations/0045_storage_content_types.sql", "utf8");

describe("csp and storage hardening", () => {
  it("enforces the CSP rather than report-only", () => {
    expect(config).toMatch(/"Content-Security-Policy"/);
    expect(config).not.toMatch(/Content-Security-Policy-Report-Only/);
  });
  it("does not allow unsafe-eval", () => {
    expect(config).not.toMatch(/'unsafe-eval'/);
  });
  it("generates a nonce in middleware", () => {
    expect(middleware).toMatch(/nonce/);
  });
  it("restricts storage uploads by content type", () => {
    expect(storage).toMatch(/storage\.extension\(name\)/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/security-hardening.test.ts`
Expected: FAIL.

- [ ] **Step 3: Enforce the CSP with a nonce**

In `middleware.ts`, generate a per-request nonce and expose it to the App Router:

```ts
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-nonce", nonce);
let response = NextResponse.next({ request: { headers: requestHeaders } });
```

In `next.config.mjs`, replace the `Content-Security-Policy-Report-Only` header with an enforced `Content-Security-Policy` that uses `script-src 'self' 'nonce-...' 'strict-dynamic'`. Because `next.config.mjs` headers are static, the nonce must be injected per-request — the cleanest Next 14 approach is to set the header in `middleware.ts` on the outgoing response instead of in `next.config.mjs`:

```ts
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com https://i.ytimg.com https://*.ytimg.com",
  "media-src 'self' https://*.supabase.co blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.safaricom.co.ke https://sandbox.safaricom.co.ke",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "report-uri /api/csp-report",
].join("; ");

response.headers.set("Content-Security-Policy", csp);
```

**Ship this behind a flag first.** Because `'strict-dynamic'` with a nonce will block any script that does not carry the nonce, deploy it as `Content-Security-Policy-Report-Only` **with a `report-uri` endpoint** for one week, then flip to enforced. Add `app/api/csp-report/route.ts` to collect violations.

- [ ] **Step 4: Restrict storage uploads by content type**

Create `supabase/migrations/0045_storage_content_types.sql`:

```sql
-- 0045 — The application validates uploads by magic bytes, but the Storage REST
-- API is directly reachable with an admin's JWT, so the policy must also
-- constrain content type. Without this an admin could publish attacker-
-- controlled HTML/SVG on the project's own *.supabase.co origin.
drop policy if exists "church-images_admin_write" on storage.objects;
create policy "church-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'church-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "leader-images_admin_write" on storage.objects;
create policy "leader-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'leader-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );

drop policy if exists "gallery-images_admin_write" on storage.objects;
create policy "gallery-images_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gallery-images'
    and public.has_permission('media.manage')
    and (storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
  );
```

Repeat for `event-posters` and `sermon-thumbnails` with the same allowlist. **Also configure `allowed_mime_types` and `file_size_limit` on each bucket via the Storage API** — bucket configuration is not expressible in RLS.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/security-hardening.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify the app still renders**

Run: `npm run build && npm run start`, then `curl -s -I http://localhost:3000/ | grep -i content-security-policy` and load a page in a browser to confirm no CSP violations block rendering.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts next.config.mjs app/api/csp-report/route.ts supabase/migrations/0045_storage_content_types.sql tests/unit/security-hardening.test.ts
git commit -m "feat(security): enforce csp with nonces and restrict storage content types"
```

---

# Wave 2 — Correctness & Performance

### Task 13: Fix PostgREST filter escaping and comma-breaking search

**Findings:** `#26`, `#27` · **Severity:** Medium

**Files:**
- Create: `lib/postgrest.ts`
- Modify: `services/sermons.ts:47-53`, `services/admin/giving.read.ts:58-62`, `services/admin/testimonies.read.ts:39-45`, `services/admin/connect-groups.read.ts:36-38`, `services/admin/prayer.audited.ts:47-49`
- Test: `tests/unit/postgrest-escape.test.ts`

**Interfaces:**
- Produces: `escapePostgrestLike(value: string): string` in `lib/postgrest.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/postgrest-escape.test.ts
import { describe, expect, it } from "vitest";
import { escapePostgrestLike } from "@/lib/postgrest";

describe("postgrest escaping", () => {
  it("escapes LIKE wildcards", () => {
    expect(escapePostgrestLike("100%")).toBe("100\\%");
  });
  it("escapes structural filter characters", () => {
    expect(escapePostgrestLike("a,b")).toBe("a\\,b");
    expect(escapePostgrestLike("a)b")).toBe("a\\)b");
  });
  it("escapes backslashes first", () => {
    expect(escapePostgrestLike("a\\b")).toBe("a\\\\b");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/postgrest-escape.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the helper**

```ts
/** Escapes a user-supplied value for use inside a PostgREST `.or()` / `.ilike()` filter. */
export function escapePostgrestLike(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([%_,()])/g, "\\$1")
    .replace(/\s+/g, " ")
    .trim();
}
```

- [ ] **Step 4: Use it at all five call sites**

Replace each hand-rolled `search.replace(/[%_]/g, ...)` with `escapePostgrestLike(search)`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/postgrest-escape.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/postgrest.ts services/sermons.ts services/admin/giving.read.ts services/admin/testimonies.read.ts services/admin/connect-groups.read.ts services/admin/prayer.audited.ts tests/unit/postgrest-escape.test.ts
git commit -m "fix(search): escape postgrest filter metacharacters in search terms"
```

---

### Task 14: Paginate admin lists and compute totals correctly

**Findings:** `#17`, `#42` · **Severity:** High

**Files:**
- Create: `lib/pagination.ts`
- Modify: `services/admin/giving.read.ts`, `services/admin/messages.read.ts`, `services/admin/serve-interests.read.ts`, `services/admin/events.read.ts`, `services/admin/sermons.read.ts`, `services/admin/testimonies.read.ts`, `services/admin/prayer.audited.ts` + the 6 admin list pages
- Test: `tests/unit/pagination.test.ts`

**Interfaces:**
- Produces: `paginate(page: number, pageSize: number): { from: number; to: number }` in `lib/pagination.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/pagination.test.ts
import { describe, expect, it } from "vitest";
import { paginate } from "@/lib/pagination";

describe("pagination", () => {
  it("clamps page numbers to at least 1", () => {
    expect(paginate(0, 50)).toEqual({ from: 0, to: 49 });
    expect(paginate(-3, 50)).toEqual({ from: 0, to: 49 });
  });
  it("floors fractional pages", () => {
    expect(paginate(2.7, 50)).toEqual({ from: 50, to: 99 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/pagination.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create the helper**

```ts
export const DEFAULT_PAGE_SIZE = 50;

export function paginate(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
```

- [ ] **Step 4: Apply it and compute counts with `head: true`**

For each admin read module: add `.range(from, to)` and a separate `count: "exact", head: true` query for the totals. Badge counts must come from the count query, **not** from the length of the truncated row set.

For `services/admin/giving.read.ts`, add the missing audit write (finding `#18`):

```ts
await writeAuditLog({
  actorId: input.actorId,
  action: "giving.read.list",
  entityType: "giving_transaction",
  entityId: null,
  metadata: { status: input.status ?? null, search: input.search ?? null, count: rows.length },
  ipHash: getClientIpHash(),
});
```

- [ ] **Step 5: Add pagination controls to the admin pages**

Reuse `app/sermons/_components/Pagination.tsx` in the 6 admin list pages, reading `page` from `searchParams`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/unit/pagination.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/pagination.ts services/admin/ app/admin/ tests/unit/pagination.test.ts
git commit -m "feat(admin): paginate admin lists and compute totals with count queries"
```

---

### Task 15: Add optimistic locking to admin content updates

**Findings:** `#20` · **Severity:** High

**Files:**
- Modify: the 10 admin update modules: `services/admin/sermons.ts`, `events.ts`, `ministries.ts`, `series.ts`, `announcements.ts`, `leaders.ts`, `gallery.ts`, `pages.ts`, `services.ts`, `connect-groups.ts`
- Test: `tests/unit/optimistic-locking.test.ts`

**Interfaces:**
- Produces: `applyUpdateGuard(query, expectedUpdatedAt)` helper, or an inline `.eq("updated_at", expected)` on each update.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/optimistic-locking.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const files = ["sermons", "events", "ministries", "series", "announcements", "leaders"];

describe("optimistic locking", () => {
  it("guards updates with the expected updated_at", () => {
    for (const f of files) {
      const src = readFileSync(`services/admin/${f}.ts`, "utf8");
      expect(src).toMatch(/\.eq\("updated_at"/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/optimistic-locking.test.ts`
Expected: FAIL.

- [ ] **Step 3: Add the guard to each update path**

Each update form must submit the record's `updated_at`. In the update action:

```ts
const { data: rows, error } = await supabase
  .from("sermons")
  .update({ ...payload })
  .eq("id", id)
  .eq("updated_at", expectedUpdatedAt)   // compare truncated to milliseconds
  .select("id");

if (error) return { ok: false, message: "Could not update." };
if (!rows || rows.length === 0) {
  return {
    ok: false,
    message: "This record was changed by someone else. Reload and try again.",
  };
}
```

`updated_at` is `timestamptz` with microsecond precision — compare against the value truncated to milliseconds, or use `.select()` and compare in JS with a tolerance of 1 ms.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/optimistic-locking.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/admin/ tests/unit/optimistic-locking.test.ts
git commit -m "feat(admin): add optimistic locking to content updates"
```

---

### Task 16: Audit-log every admin mutation

**Findings:** `#18`, `#36` · **Severity:** High

**Files:**
- Create: `services/admin/_shared.ts`
- Modify: the 12 modules missing `writeAuditLog`: `users.ts`, `settings.ts`, `announcements.ts`, `events.ts`, `gallery.ts`, `leaders.ts`, `ministries.ts`, `pages.ts`, `prayer.ts`, `series.ts`, `sermons.ts`, `services.ts`
- Test: `tests/unit/audit-coverage.test.ts`

**Interfaces:**
- Produces: `writeAuditLog` calls with a consistent `action` naming convention: `<entity>.<verb>` (e.g. `admin.enable`, `settings.update`, `sermons.create`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/audit-coverage.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const modules = ["users", "settings", "announcements", "events", "gallery", "leaders", "ministries", "pages", "prayer", "series", "sermons", "services"];

describe("admin audit coverage", () => {
  it("every admin mutation module writes an audit log", () => {
    for (const m of modules) {
      const src = readFileSync(`services/admin/${m}.ts`, "utf8");
      expect(src, m).toMatch(/writeAuditLog/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/audit-coverage.test.ts`
Expected: FAIL for the modules missing the call.

- [ ] **Step 3: Add the missing audit writes**

Each write action gets:

```ts
await writeAuditLog({
  actorId: auth.userId,
  action: "admin.toggle_active",
  entityType: "admins",
  entityId: parsed.data.id,
  metadata: { is_active: parsed.data.is_active },
  ipHash: getClientIpHash(),
});
```

- [ ] **Step 4: Extract the shared boilerplate**

Create `services/admin/_shared.ts` holding `flattenZod`, `CONTENT_STATUS`, and `AdminActionState` (moved out of `services/admin/sermons.ts`, which 19 files currently import from). This removes ~264 LOC of duplication and gives the audit write a single home.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/audit-coverage.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add services/admin/ tests/unit/audit-coverage.test.ts
git commit -m "feat(admin): audit log every admin mutation and share crud helpers"
```

---

### Task 17: Move public content routes off `force-dynamic` and fix cross-instance caching

**Findings:** `#22` · **Severity:** High

**Files:**
- Modify: `lib/cache.ts`, the public content pages, `services/content.ts`, `services/sermons.ts`, `services/gallery.ts`
- Test: `tests/unit/caching.test.ts`

**Interfaces:**
- Produces: `unstable_cache`-based site-settings caching with a shared cache tag, invalidated via `revalidateTag("site-settings")`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/caching.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const cache = readFileSync("lib/cache.ts", "utf8");

describe("caching", () => {
  it("does not use a process-local Map for shared settings", () => {
    expect(cache).not.toMatch(/new Map/);
  });
  it("uses a revalidation tag", () => {
    expect(cache).toMatch(/unstable_cache|revalidateTag/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/caching.test.ts`
Expected: FAIL.

- [ ] **Step 3: Replace the in-process cache**

```ts
// lib/cache.ts
import { unstable_cache } from "next/cache";

export const CACHE_TAGS = {
  siteSettings: "site-settings",
  socialLinks: "social-links",
  featuredMinistries: "featured-ministries",
  featuredLeaders: "featured-leaders",
  publishedServices: "published-services",
} as const;

export const cacheTag = (tag: string) => ({ tags: [tag] });
```

`getSiteSettings` becomes:

```ts
export const getSiteSettings = unstable_cache(
  async () => { /* ...existing query... */ },
  ["site-settings"],
  { tags: [CACHE_TAGS.siteSettings], revalidate: 3600 },
);
```

`invalidateCache` becomes `revalidateTag(tag)` — which **is** cross-instance on Vercel.

- [ ] **Step 4: Remove `force-dynamic` from read-only public routes**

Delete `export const dynamic = "force-dynamic"` from the public content pages (sermons, events, gallery, ministries, testimonies, about, services, visit, connect, give, prayer, contact, privacy, announcements) and add `export const revalidate = 60` where a short freshness window is acceptable.

**Leave `force-dynamic` in place** for: `app/account/**`, `app/admin/**`, and any page that reads the session cookie.

> **Note:** the existing `revalidatePath()` calls in admin actions become meaningful again once these routes are cached — verify each one after the change.

- [ ] **Step 5: Cache the sitemap**

In `app/sitemap.ts`, add `export const revalidate = 3600` so Googlebot crawls do not fire 7 Supabase queries each time.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/unit/caching.test.ts`
Expected: PASS.

- [ ] **Step 7: Verify the build output**

Run: `npm run build`
Expected: public content routes now show `○ (Static)` or `◐ (ISR)` instead of `ƒ (Dynamic)`.

- [ ] **Step 8: Commit**

```bash
git add lib/cache.ts services/ app/ tests/unit/caching.test.ts
git commit -m "perf: cache public content and use cross-instance revalidation tags"
```

---

### Task 18: Move the Vercel region and trim the public asset weight

**Findings:** `#21`, `#41`, `#44` · **Severity:** High

**Files:**
- Modify: `vercel.json`, `app/ministries/hospitality/orphans/page.tsx:22-49,170-178`
- Test: `tests/unit/asset-weight.test.ts`

**Interfaces:**
- Produces: `vercel.json` regions `["cpt1"]`; no file in `public/` exceeds 300 KB except intentional videos moved to Supabase Storage.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/asset-weight.test.ts
import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_BYTES = 300 * 1024;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

describe("public asset weight", () => {
  it("has no oversized assets outside the media folder", () => {
    const offenders = walk("public")
      .filter((f) => !f.startsWith("public/media"))
      .filter((f) => statSync(f).size > MAX_BYTES);
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/asset-weight.test.ts`
Expected: FAIL — the MP4s and the 1.4 MB favicon exceed the limit.

- [ ] **Step 3: Change the Vercel region**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "outputDirectory": ".next",
  "regions": ["cpt1"],
  "github": { "silent": false, "autoAlias": true }
}
```

> **Verify first:** check where the Supabase project is hosted. If it is in `us-east-1`, move it to `af-south-1` or `eu-central-1` — edge placement is only a win if the database is nearby.

- [ ] **Step 4: Move the videos to Supabase Storage**

Upload the 3 MP4s to the `media` bucket (admin-only read per `ARCHITECTURE.md:82-83`) and replace the `<video>` in `app/ministries/hospitality/orphans/page.tsx:170-178`:

```tsx
<video
  controls
  preload="none"
  poster="/orphans-vulnerables/photo-1.jpeg"
  className="aspect-video w-full bg-brand-900/10"
  aria-label="Recording from the 700-student education support program"
>
  <source src="https://<project-ref>.supabase.co/storage/v1/object/public/media/orphans-program.mp4" type="video/mp4" />
</video>
```

- [ ] **Step 5: Delete the duplicate folder and compress the favicon**

```bash
rm -rf "public/ORPHANS AND VULNERABLES"
rm -f "public/file_000000007d4471f4844f50bf86f4c7f6.png"
npx sharp-cli -i public/favicon.png -o public/favicon.png resize 256 256 --webp
```

Wire `scripts/optimize-images.mjs` into `package.json`:

```json
"optimize:images": "node scripts/optimize-images.mjs"
```

and add it to the CI workflow after checkout.

- [ ] **Step 6: Fix the favicon reference**

In `app/layout.tsx:87`:

```ts
icons: {
  icon: [
    { url: "/favicon.png", type: "image/png", sizes: "256x256" },
    { url: "/favicon.ico", sizes: "any" },
  ],
  apple: [{ url: "/favicon.png", sizes: "256x256" }],
},
```

Generate a real `public/favicon.ico` from the PNG.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/unit/asset-weight.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add vercel.json app/ministries/hospitality/orphans/page.tsx app/layout.tsx public/ package.json .github/workflows/ci.yml tests/unit/asset-weight.test.ts
git commit -m "perf: move videos to storage, compress assets and target a closer region"
```

---

### Task 19: Wire `aria-describedby` and fix colour contrast

**Findings:** `#34`, `#35` · **Severity:** Medium

**Files:**
- Modify: `components/ui/Form.tsx:15-30`, `components/ui/Input.tsx`, `components/ui/Textarea.tsx`, `tailwind.config.ts`
- Test: `tests/unit/a11y-forms.test.ts`

**Interfaces:**
- Produces: `Field` clones its child with `aria-describedby` and `aria-invalid`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/a11y-forms.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const form = readFileSync("components/ui/Form.tsx", "utf8");

describe("form accessibility", () => {
  it("uses aria-describedby, not data-described-by", () => {
    expect(form).toMatch(/aria-describedby/);
    expect(form).not.toMatch(/data-described-by/);
  });
  it("marks invalid fields", () => {
    expect(form).toMatch(/aria-invalid/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/a11y-forms.test.ts`
Expected: FAIL.

- [ ] **Step 3: Clone the child with the ARIA attributes**

In `components/ui/Form.tsx`, replace the `<div data-described-by=...>` wrapper with `React.cloneElement`:

```tsx
import { cloneElement, isValidElement, type ReactNode } from "react";

export function Field({
  htmlFor,
  label,
  hint,
  error,
  required,
  children,
}: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const child = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1.5">
      {/* ...label, hint, error... */}
      {child}
    </div>
  );
}
```

- [ ] **Step 4: Fix the contrast tokens**

In `tailwind.config.ts`, darken the failing tokens so they clear 4.5:1 on white:

- `accent.500` `#E5B400` → `#9A7200` (≈4.6:1 on white). Keep `#E5B400` available as `accent.300` for decorative rules only.
- `ink.subtle` `#8A93A6` → `#6B7383` (≈4.6:1 on white, ≈4.3:1 on `surface.muted`).

Re-measure every token pair after the change — the audit's table in `docs/AUDIT_2026-10-21.md` lists all 16 measured pairs and their ratios.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/a11y-forms.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/ui/Form.tsx components/ui/Input.tsx components/ui/Textarea.tsx tailwind.config.ts tests/unit/a11y-forms.test.ts
git commit -m "fix(a11y): wire aria-describedby and fix failing contrast tokens"
```

---

# Wave 3 — Remaining Medium & Low

Acceptance criteria are given precisely; implement them in any order, one commit each.

| # | Task | Files | Acceptance criteria |
| --- | --- | --- | --- |
| 1 | Require `M_PESA_CALLBACK_SECRET` in live mode; remove the `?? M_PESA_PASSKEY` fallback in all 3 places | `lib/env.ts`, `services/payment/index.ts`, `app/api/mpesa/callback/route.ts`, both edge functions | Live mode with Daraja creds and no callback secret → throws at startup. `M_PESA_PASSKEY` never used as an HMAC key. |
| 2 | Bind STK pushes to the member's own phone | `supabase/functions/mpesa-stk-push/index.ts` | A phone number that does not match `profiles.phone` returns 400. Rate limit tightened to 3 per 10 min per user **and** per phone. |
| 3 | Fail closed on rate-limit infrastructure errors | `lib/rate-limit.ts:57-83` | In production, an RPC error returns `{ ok: false }` instead of falling back to the in-memory Map. |
| 4 | Stop resetting `published_at` on every edit | 8 admin modules | `published_at` only changes when the status transitions into `PUBLISHED` and it was previously null. |
| 5 | Validate content status transitions server-side | `services/admin/approvals.workflow.ts:49-97` | A `CONTENT_TRANSITIONS` map rejects `PUBLISHED → DRAFT` and `REJECTED → PUBLISHED` outside the approval queue. |
| 6 | Fix gallery revalidation to use the slug | `services/admin/gallery.ts:116,120-127` | `revalidatePath('/gallery/<slug>')` after adding and removing items; storage objects deleted with their rows. |
| 7 | Paginate the sermon series page | `app/sermons/series/[slug]/page.tsx` | `searchParams.page` is read and `<Pagination basePath={...}>` is rendered. |
| 8 | Fix serve-interest badge counts | `services/admin/serve-interests.read.ts:114-139` | The count query applies the same `ministryId` filter as the list. |
| 9 | Stop leaking raw Supabase errors | `services/admin/leaders.ts:79` | The message is a fixed string; the raw error goes to `console.error` only. |
| 10 | Render admin delete errors inline and redirect on success | 10 admin detail pages | The delete action returns state instead of throwing; on success it `redirect()`s to the list route. |
| 11 | Fix the audit-log actor column | `services/admin/audit.read.ts:31` | The column shows the actor's **email**, not their profile UUID. |
| 12 | Add a last-admin guard and surface the toggle result | `services/admin/users.ts`, `AdminToggle.tsx` | The last active admin cannot be deactivated; the client renders the returned `{ ok: false, message }`. |
| 13 | Extract `lib/phone.ts` and use it everywhere | `services/payment/mpesa.ts`, `mpesa-stk-push/index.ts`, `tests/unit/phone-normalization.test.ts` | One `normalizeKenyanPhone()`; the test imports the production function; a 15-digit `254…` number is rejected. |
| 14 | Validate the giving phone format in the server action | `services/giving.actions.ts` | The error is attached to `state.errors.phone`, not a generic alert. |
| 15 | Replace the homepage's serial awaits with `Promise.all` | `app/page.tsx:44-57` | All section data is fetched in one `Promise.all` and passed down as props. |
| 16 | Add `app/manifest.ts` and `appleWebApp` metadata | new `app/manifest.ts`, `app/layout.tsx` | `/manifest.webmanifest` returns 200 with a valid manifest. |
| 17 | Add `WebSite` schema and fix the robots `Host` | `lib/seo.ts`, `app/robots.ts:19`, `app/layout.tsx` | `Host:` emits a bare hostname; `/account`, `/login`, `/register` are disallowed in robots.txt; a `WebSite` node with a `publisher` link to `#church` is emitted. |
| 18 | Give utility pages their own canonical | `app/login`, `app/register`, `app/reset-password`, `app/forgot-password`, `app/account` | Each emits `alternates.canonical` pointing at itself, not `/`. Add a `noindexPage()` helper in `lib/seo.ts`. |
| 19 | Set `max-image-preview: large` on every page | `lib/seo.ts:100-102` | The `googleBot` object is merged into `buildPageMetadata` so it is not dropped by the child's `robots` override. |
| 20 | Trim `public/` and wire the optimizer into CI | `package.json`, `.github/workflows/ci.yml` | `npm run optimize:images` exists and runs in CI; no `public/` file exceeds 300 KB. |
| 21 | Add `loading.tsx` to the slow route segments | 5 new files | `app/sermons`, `app/events`, `app/gallery`, `app/account`, `app/admin/(protected)` each have a `loading.tsx`. |
| 22 | Add `app/global-error.tsx` and `app/api/health` | new files | A root-layout failure renders a branded page; `/api/health` returns `{ ok: true }` after a DB ping. |
| 23 | Fix `supabase/config.toml` signup and add `seed.sql` | `supabase/config.toml`, new `supabase/seed.sql` | `[auth.email] enable_signup = true`; `supabase db reset` produces a working member-registration stack. |
| 24 | Add audit coverage for prayer reads in the dashboard | `services/dashboard.ts:130-136` | `getDashboardCounts` and the recent-activity query write audit rows. |
| 25 | Reduce `/give` bundle size | `app/give/page.tsx` | The giving form is loaded via `next/dynamic`; route JS drops below 40 kB. |

# Wave 4 — Product Gaps

These are new features, not fixes. Each ships behind its own PR.

| # | Feature | Effort | Notes |
| --- | --- | --- | --- |
| 1 | **Transactional email for prayer + contact requests** | L | New Edge Function `notify-staff` + a mail provider. Called from `services/prayer.ts:70` and `services/contact.actions.ts`. **Highest ministry impact — a pastor who is not logged in never sees a prayer request today.** |
| 2 | **Giving receipts (PDF + emailed)** | L | `app/give/page.tsx:116` says "Receipt on request". Add `app/account/giving/[id]/receipt` + a PDF renderer; trigger from `services/giving.ts` on `SUCCESS`. |
| 3 | **Guest (anonymous) giving** | M | `services/giving.ts:87-98` requires a signed-in member. Biggest giving-conversion blocker. |
| 4 | **Event capacity + attendee list + check-in** | L | `app/events/actions.ts:95` skips capacity. Needs a race-safe `register_for_event()` RPC. |
| 5 | **Newsletter subscribe + admin list** | S | The table, RLS, permission and role grant all exist with **zero** code references. |
| 6 | **Site-wide search** | M | Only `/sermons` has a search box today. |
| 7 | **Livestream embed + schedule + admin control** | M | `app/livestream/page.tsx` renders no embed; `social_links` is seeded with empty URLs and `is_active=false`. |
| 8 | **CMS catch-all route** | S | `services/admin/pages.ts` calls `revalidatePath('/${slug}')` but there is no `app/[slug]/page.tsx`. Editors can publish pages that are permanently 404. |
| 9 | **Connect-group leader assignment as a profile FK** | M | `leader_display_name` is free text today. |
| 10 | **Sermon `Article` schema + per-sermon OG image** | S | Sermon pages have no text content for Google; `VideoObject` is rejected without `thumbnailUrl`. |

---

## Final Verification Gate

Before merging the remediation branch:

```bash
npm run typecheck      # 0 errors
npm run lint           # 0 warnings, 0 errors
npm test               # 395 + all new tests pass
npm run build          # succeeds; public routes show ○/◐, admin routes ƒ
npm run format:check   # 0 files differ
```

Then, against a production build:

```bash
npm run start
# 1. Unknown URLs return 404
for p in events/nope sermons/nope ministries/nope gallery/nope; do
  printf "/%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$p"
done
# 2. og:image resolves
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/opengraph-image
# 3. Exactly one h1 per page
for p in / /about /give /prayer /visit /services /contact /events /sermons; do
  printf "%s h1=" "$p"; curl -s "http://localhost:3000$p" | grep -c '<h1'
done
# 4. Canonical uses the real site URL
curl -s http://localhost:3000/ | grep -o 'rel="canonical"[^>]*'
```

Expected: `404` for all unknown URLs, `200` for `/opengraph-image`, `1` h1 on every page, and a canonical containing the production site URL.

## Self-Review

- **Spec coverage:** every Critical (#1-#10) and High (#11-#22) finding from `docs/AUDIT_2026-10-21.md` maps to a task in Waves 1-2. The 25 Medium findings map to Wave 3. The 10 product gaps map to Wave 4. The 31 Low findings are covered by the Wave 3 table and the documentation task below.
- **Step scan:** every step names one file, one behaviour and one verification command. No step says "handle edge cases" or "add appropriate validation".
- **Type consistency:** `resolveSiteUrl()`, `buildPageMetadata({ absoluteTitle })`, `escapePostgrestLike()`, `paginate()`, `MAX_GIFT_CENTS`, `generateIdempotencyKey(categoryId, amountCents, phone, userId, transactionId)`, `signCallbackToken(transactionId, secret, checkoutId?)` and `formatKenyaDate()` are each introduced once and consumed with the same signature everywhere.
- **Review Focus:** all five failure modes have a pinned test — member id tampering (Task 2, 5.4), duplicate/mismatched callback (Task 3, 2.2), shared family phone (Task 5), crawler 404 (Task 9), concurrent admin edits (Task 15).
- **Proportion:** the plan states decisions an implementer cannot make alone (exact SQL, exact function signatures, exact test assertions) without transcribing whole files.

## Documentation Task (do last)

Once the code is fixed, update the docs so they stop lying:

- `SECURITY.md` — correct the middleware claim, the "all admin actions are recorded" claim, and the file-type validation claim.
- `README.md` / `ARCHITECTURE.md` — replace "68 unit tests" with the real count; remove the non-existent `requireRole`; document the actual storage buckets; document the `app/(public)`-less structure.
- `ACCESSIBILITY.md` — remove the `respectMotion()` claim; describe the real focus-restoration behaviour.
- `UI_UX_AUDIT.md` — re-theme to the Royal Blue palette or mark it superseded by this audit.
- `PROJECT_AUDIT.md` — mark the Phase 0 document as historical; link to `docs/AUDIT_2026-10-21.md`.
- Add `SECRET_ROTATION.md` — owners, cadence, and the exact `supabase secrets set` / Vercel CLI commands.
- Add a `RUNBOOK.md` — the M-Pesa callback failure procedure (alert query, owner, escalation, manual reconciliation SQL).
