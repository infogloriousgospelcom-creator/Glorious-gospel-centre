import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ModerateMembershipSchema,
  normalizeAdminNoteForRpc,
} from "@/lib/connect-group-membership-moderation-schema";
import {
  MEMBERSHIP_ADMIN_ONLY_COLUMNS,
  MEMBER_MEMBERSHIP_PUBLIC_COLUMNS,
  membershipStatusLabel,
} from "@/lib/connect-group-members";

const migration0031 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0031_connect_group_members_moderation.sql"),
  "utf8",
);
const migration0028 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0028_connect_group_members.sql"),
  "utf8",
);
const migration0029 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0029_leave_connect_group.sql"),
  "utf8",
);
const actionsSrc = readFileSync(
  resolve(process.cwd(), "services/admin/connect-group-members.ts"),
  "utf8",
);
const readSrc = readFileSync(
  resolve(process.cwd(), "services/admin/connect-group-members.read.ts"),
  "utf8",
);

describe("I-B4 moderation schema", () => {
  it("requires a membership uuid", () => {
    expect(ModerateMembershipSchema.safeParse({ membership_id: "" }).success).toBe(false);
    expect(
      ModerateMembershipSchema.safeParse({
        membership_id: "33333333-3333-4333-8333-333333333333",
      }).success,
    ).toBe(true);
  });

  it("rejects oversized admin notes", () => {
    expect(
      ModerateMembershipSchema.safeParse({
        membership_id: "33333333-3333-4333-8333-333333333333",
        admin_note: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("normalizes blank notes to null (leave unchanged in RPC)", () => {
    expect(normalizeAdminNoteForRpc(undefined)).toBeNull();
    expect(normalizeAdminNoteForRpc("")).toBeNull();
    expect(normalizeAdminNoteForRpc("  ")).toBeNull();
    expect(normalizeAdminNoteForRpc("  Keep private  ")).toBe("Keep private");
  });
});

describe("I-B4 moderation RPCs (static SQL)", () => {
  it("defines three narrowly scoped SECURITY DEFINER RPCs", () => {
    for (const name of [
      "approve_connect_group_membership",
      "decline_connect_group_membership",
      "remove_connect_group_membership",
    ]) {
      expect(migration0031).toMatch(
        new RegExp(`create or replace function public\\.${name}`),
      );
    }
    expect(migration0031).toMatch(/security definer/g);
    expect(migration0031).toMatch(/set search_path = public/);
  });

  it("requires auth.uid and connect_groups.members.manage inside each RPC", () => {
    for (const name of [
      "approve_connect_group_membership",
      "decline_connect_group_membership",
      "remove_connect_group_membership",
    ]) {
      const start = migration0031.indexOf(`create or replace function public.${name}`);
      const next = migration0031.indexOf("create or replace function public.", start + 10);
      const body = migration0031.slice(start, next === -1 ? undefined : next);
      expect(body).toMatch(/auth\.uid\(\) is null/);
      expect(body).toMatch(/has_permission\('connect_groups\.members\.manage'\)/);
      expect(body).toMatch(/for update/);
      expect(body).toMatch(/decided_by = auth\.uid\(\)/);
      expect(body).toMatch(/decided_at = now\(\)/);
      expect(body).not.toMatch(/p_decided_by/);
      expect(body).not.toMatch(/p_profile_id/);
      expect(body).not.toMatch(/p_connect_group_id/);
    }
  });

  it("approve is PENDING→ACTIVE with capacity helper excluding self", () => {
    const start = migration0031.indexOf(
      "create or replace function public.approve_connect_group_membership",
    );
    const end = migration0031.indexOf(
      "create or replace function public.decline_connect_group_membership",
    );
    const body = migration0031.slice(start, end);
    expect(body).toMatch(/PENDING'::public\.connect_group_member_status/);
    expect(body).toMatch(/ACTIVE'::public\.connect_group_member_status/);
    expect(body).toMatch(/connect_group_has_membership_capacity\(m\.connect_group_id, m\.id\)/);
    expect(body).toMatch(/only PENDING memberships can be approved/);
  });

  it("decline is PENDING→DECLINED only", () => {
    const start = migration0031.indexOf(
      "create or replace function public.decline_connect_group_membership",
    );
    const end = migration0031.indexOf(
      "create or replace function public.remove_connect_group_membership",
    );
    const body = migration0031.slice(start, end);
    expect(body).toMatch(/DECLINED'::public\.connect_group_member_status/);
    expect(body).toMatch(/only PENDING memberships can be declined/);
    expect(body).not.toMatch(/connect_group_has_membership_capacity/);
  });

  it("remove is ACTIVE→REMOVED only and preserves the row", () => {
    const start = migration0031.indexOf(
      "create or replace function public.remove_connect_group_membership",
    );
    const body = migration0031.slice(start);
    expect(body).toMatch(/ACTIVE'::public\.connect_group_member_status/);
    expect(body).toMatch(/REMOVED'::public\.connect_group_member_status/);
    expect(body).toMatch(/only ACTIVE memberships can be removed/);
    expect(body).not.toMatch(/\bdelete\b/i);
  });

  it("revokes EXECUTE from public and anon; grants authenticated", () => {
    expect(migration0031).toMatch(
      /revoke all on function public\.approve_connect_group_membership\(uuid, text\) from anon/,
    );
    expect(migration0031).toMatch(
      /revoke all on function public\.decline_connect_group_membership\(uuid, text\) from anon/,
    );
    expect(migration0031).toMatch(
      /revoke all on function public\.remove_connect_group_membership\(uuid, text\) from anon/,
    );
    expect(migration0031).toMatch(
      /grant execute on function public\.approve_connect_group_membership\(uuid, text\) to authenticated/,
    );
    expect(migration0031).toMatch(
      /grant execute on function public\.decline_connect_group_membership\(uuid, text\) to authenticated/,
    );
    expect(migration0031).toMatch(
      /grant execute on function public\.remove_connect_group_membership\(uuid, text\) to authenticated/,
    );
  });

  it("does not create a generic arbitrary-status update RPC", () => {
    expect(migration0031).not.toMatch(/set_connect_group_member_status/);
    expect(migration0031).not.toMatch(/p_new_status/);
    expect(migration0031).not.toMatch(/p_status/);
  });

  it("does not weaken I-B3 leave or member UPDATE grants", () => {
    expect(migration0029).toMatch(/create or replace function public\.leave_connect_group/);
    expect(migration0031).not.toMatch(
      /create or replace function public\.leave_connect_group/,
    );
    expect(migration0031).not.toMatch(
      /grant update .+ on table public\.connect_group_members/,
    );
    expect(migration0028).toMatch(/Intentionally NOT granted to authenticated/);
  });
});

describe("I-B4 admin actions security (static)", () => {
  it("checks connect_groups.members.manage and uses authenticated RPC writes", () => {
    expect(actionsSrc).toMatch(/connect_groups\.members\.manage/);
    expect(actionsSrc).toMatch(/approve_connect_group_membership/);
    expect(actionsSrc).toMatch(/decline_connect_group_membership/);
    expect(actionsSrc).toMatch(/remove_connect_group_membership/);
    expect(actionsSrc).toMatch(/\.rpc\(/);
    expect(actionsSrc).not.toMatch(/createServiceRoleClient/);
    expect(actionsSrc).toMatch(/writeAuditLog/);
    expect(actionsSrc).toMatch(/connect_group_member\.approve/);
    expect(actionsSrc).toMatch(/connect_group_member\.decline/);
    expect(actionsSrc).toMatch(/connect_group_member\.remove/);
  });

  it("admin reads use permission gate before service-role private columns", () => {
    expect(readSrc).toMatch(/connect_groups\.members\.manage/);
    expect(readSrc).toMatch(/createServiceRoleClient/);
    expect(readSrc).toMatch(/admin_note/);
    expect(readSrc).toMatch(/decided_by/);
  });

  it("keeps admin_note and decided_by out of congregant SELECT grants", () => {
    for (const col of MEMBERSHIP_ADMIN_ONLY_COLUMNS) {
      expect(MEMBER_MEMBERSHIP_PUBLIC_COLUMNS).not.toContain(col);
    }
  });
});

describe("I-B4 status labels for congregant UI", () => {
  it("labels all membership statuses including moderation outcomes", () => {
    expect(membershipStatusLabel("PENDING")).toMatch(/pending/i);
    expect(membershipStatusLabel("ACTIVE")).toMatch(/member/i);
    expect(membershipStatusLabel("DECLINED")).toMatch(/declined/i);
    expect(membershipStatusLabel("LEFT")).toMatch(/left/i);
    expect(membershipStatusLabel("REMOVED")).toMatch(/ended/i);
  });
});
