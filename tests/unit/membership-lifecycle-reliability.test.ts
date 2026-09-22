import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration0035 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0035_membership_lifecycle_reliability.sql"),
  "utf8",
);
const migration0034 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0034_member_notifications.sql"),
  "utf8",
);
const actionsSrc = readFileSync(
  resolve(process.cwd(), "services/connect-group-membership.actions.ts"),
  "utf8",
);
const memberUx = readFileSync(resolve(process.cwd(), "docs/MEMBER_UX.md"), "utf8");

describe("I-B10 migration 0035 — membership_generation", () => {
  it("adds positive membership_generation with default 1", () => {
    expect(migration0035).toMatch(
      /add column if not exists membership_generation integer not null default 1/,
    );
    expect(migration0035).toMatch(/membership_generation_positive/);
    expect(migration0035).toMatch(/check \(membership_generation >= 1\)/);
  });

  it("does not grant membership_generation to authenticated clients", () => {
    expect(migration0035).not.toMatch(
      /grant (select|insert|update).*membership_generation.*to authenticated/i,
    );
  });

  it("increments generation on re-request and requires generation+1 in before_update", () => {
    expect(migration0035).toMatch(
      /membership_generation = membership_generation \+ 1/,
    );
    expect(migration0035).toMatch(
      /new\.membership_generation = old\.membership_generation \+ 1/,
    );
  });

  it("forces generation 1 on congregant INSERT", () => {
    expect(migration0035).toMatch(/new\.membership_generation := 1/);
  });

  it("leave path keeps generation unchanged", () => {
    expect(migration0035).toMatch(
      /new\.membership_generation is not distinct from old\.membership_generation/,
    );
  });
});

describe("I-B10 notification dedupe across lifecycle cycles", () => {
  it("extends emit_member_notification with membership_generation", () => {
    expect(migration0035).toMatch(/drop function if exists public\.emit_member_notification/);
    expect(migration0035).toMatch(/p_membership_generation integer default 1/);
    expect(migration0035).toMatch(/:g' \|\| v_gen::text/);
    expect(migration0035).toMatch(/on conflict \(dedupe_key\) do nothing/);
  });

  it("revokes emit EXECUTE from anon and authenticated", () => {
    const emitRevokes = migration0035.match(
      /revoke all on function public\.emit_member_notification\([\s\S]*?\) from (public|anon|authenticated)/g,
    );
    expect(emitRevokes?.length).toBeGreaterThanOrEqual(3);
    expect(migration0035).not.toMatch(
      /grant execute on function public\.emit_member_notification/,
    );
  });

  it("approve/decline/remove pass membership_generation into emit", () => {
    for (const event of [
      "connect_group.approved",
      "connect_group.declined",
      "connect_group.removed",
    ]) {
      expect(migration0035).toMatch(new RegExp(event));
    }
    // Three emit call sites should include generation argument
    const emitCalls = migration0035.match(
      /perform public\.emit_member_notification\([\s\S]*?m\.membership_generation\s*\)/g,
    );
    expect(emitCalls?.length).toBe(3);
  });

  it("preserves unique dedupe_key constraint from 0034", () => {
    expect(migration0034).toMatch(/unique \(dedupe_key\)/);
    expect(migration0035).not.toMatch(/drop constraint.*dedupe/i);
  });

  it("documents same-cycle idempotency vs cross-cycle new notifications", () => {
    expect(migration0035).toMatch(/same-cycle retries/i);
    expect(migration0035).toMatch(/re-request cycles/i);
  });
});

describe("I-B10 database verified-email enforcement", () => {
  it("creates require_verified_email_for_membership without client EXECUTE", () => {
    expect(migration0035).toMatch(
      /create or replace function public\.require_verified_email_for_membership\(\)/,
    );
    expect(migration0035).toMatch(/security definer/);
    expect(migration0035).toMatch(/set search_path = public/);
    expect(migration0035).toMatch(/auth\.users/);
    expect(migration0035).toMatch(/email_confirmed_at/);
    expect(migration0035).toMatch(/auth\.uid\(\)/);
    expect(migration0035).toMatch(
      /revoke all on function public\.require_verified_email_for_membership\(\) from (public|anon|authenticated)/,
    );
    expect(migration0035).not.toMatch(
      /grant execute on function public\.require_verified_email_for_membership/,
    );
    expect(migration0035).not.toMatch(/grant select.*on.*auth\.users/i);
  });

  it("calls verified-email check from insert trigger and re-request RPC", () => {
    expect(migration0035).toMatch(
      /perform public\.require_verified_email_for_membership\(\)/,
    );
    const calls = migration0035.match(
      /perform public\.require_verified_email_for_membership\(\)/g,
    );
    expect(calls?.length).toBeGreaterThanOrEqual(2);
  });

  it("preserves application-level emailConfirmed checks (defense in depth)", () => {
    expect(actionsSrc).toMatch(/emailConfirmed/);
    const joinIdx = actionsSrc.indexOf("requestConnectGroupJoinAction");
    const rereqIdx = actionsSrc.indexOf("rerequestConnectGroupMembershipAction");
    expect(joinIdx).toBeGreaterThan(-1);
    expect(rereqIdx).toBeGreaterThan(-1);
    expect(actionsSrc.slice(joinIdx, rereqIdx)).toMatch(/emailConfirmed/);
    expect(actionsSrc.slice(rereqIdx)).toMatch(/emailConfirmed/);
  });
});

describe("I-B10 security posture preserved", () => {
  it("keeps moderation permission and decided_by server-derived", () => {
    expect(migration0035).toMatch(/has_permission\('connect_groups\.members\.manage'\)/);
    expect(migration0035).toMatch(/decided_by = auth\.uid\(\)/);
    expect(migration0035).toMatch(/decided_at = now\(\)/);
  });

  it("keeps authenticated-only EXECUTE on membership RPCs; anon revoked", () => {
    for (const fn of [
      "approve_connect_group_membership",
      "decline_connect_group_membership",
      "remove_connect_group_membership",
      "rerequest_connect_group_membership",
    ]) {
      expect(migration0035).toMatch(
        new RegExp(`revoke all on function public\\.${fn}\\(uuid, text\\) from anon`),
      );
      expect(migration0035).toMatch(
        new RegExp(`grant execute on function public\\.${fn}\\(uuid, text\\) to authenticated`),
      );
    }
  });

  it("does not introduce leave/re-request/announcement notification kinds", () => {
    expect(migration0035).not.toMatch(/connect_group\.left/);
    expect(migration0035).not.toMatch(/connect_group\.rerequest/);
    expect(migration0035).not.toMatch(/announcement\./);
  });
});

describe("I-B10 documentation", () => {
  it("documents DB email verification and lifecycle notification identity", () => {
    expect(memberUx).toMatch(/verified email/i);
    expect(memberUx).toMatch(/membership_generation|lifecycle/i);
    expect(memberUx).toMatch(/dedupe|idempotent/i);
  });
});
