import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  RerequestConnectGroupSchema,
  membershipJoinBlockedMessage,
} from "@/lib/connect-group-membership-schema";

const migration0032 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0032_connect_group_membership_rerequest.sql"),
  "utf8",
);
const migration0029 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0029_leave_connect_group.sql"),
  "utf8",
);
const migration0031 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0031_connect_group_members_moderation.sql"),
  "utf8",
);
const actionsSrc = readFileSync(
  resolve(process.cwd(), "services/connect-group-membership.actions.ts"),
  "utf8",
);
const panelSrc = readFileSync(
  resolve(
    process.cwd(),
    "app/connect/[slug]/_components/ConnectGroupMembershipPanel.tsx",
  ),
  "utf8",
);

describe("I-B5 re-request schema", () => {
  it("requires membership uuid and caps member note", () => {
    expect(RerequestConnectGroupSchema.safeParse({ membership_id: "" }).success).toBe(false);
    expect(
      RerequestConnectGroupSchema.safeParse({
        membership_id: "44444444-4444-4444-8444-444444444444",
        member_note: "Looking forward to fellowship again",
      }).success,
    ).toBe(true);
    expect(
      RerequestConnectGroupSchema.safeParse({
        membership_id: "44444444-4444-4444-8444-444444444444",
        member_note: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("guides terminal statuses toward re-request instead of contact-only", () => {
    expect(membershipJoinBlockedMessage("DECLINED")).toMatch(/request to join again/i);
    expect(membershipJoinBlockedMessage("LEFT")).toMatch(/request to join again/i);
    expect(membershipJoinBlockedMessage("REMOVED")).toMatch(/request to join again/i);
  });
});

describe("I-B5 rerequest RPC (static SQL)", () => {
  it("defines SECURITY DEFINER rerequest with fixed search_path", () => {
    expect(migration0032).toMatch(
      /create or replace function public\.rerequest_connect_group_membership/,
    );
    expect(migration0032).toMatch(/security definer/);
    expect(migration0032).toMatch(/set search_path = public/);
  });

  it("requires auth.uid ownership and terminal statuses only", () => {
    expect(migration0032).toMatch(/auth\.uid\(\) is null/);
    expect(migration0032).toMatch(/profile_id is distinct from auth\.uid\(\)/);
    expect(migration0032).toMatch(/for update/);
    expect(migration0032).toMatch(/DECLINED'::public\.connect_group_member_status/);
    expect(migration0032).toMatch(/LEFT'::public\.connect_group_member_status/);
    expect(migration0032).toMatch(/REMOVED'::public\.connect_group_member_status/);
    expect(migration0032).toMatch(/PENDING'::public\.connect_group_member_status/);
    expect(migration0032).not.toMatch(/p_profile_id/);
    expect(migration0032).not.toMatch(/p_connect_group_id/);
    expect(migration0032).not.toMatch(/p_decided_by/);
  });

  it("resets decision fields and refreshes requested_at", () => {
    expect(migration0032).toMatch(/requested_at = now\(\)/);
    expect(migration0032).toMatch(/left_at = null/);
    expect(migration0032).toMatch(/decided_at = null/);
    expect(migration0032).toMatch(/decided_by = null/);
    expect(migration0032).toMatch(/admin_note = null/);
  });

  it("reuses open-for-join and capacity helpers", () => {
    expect(migration0032).toMatch(/connect_group_is_open_for_join\(m\.connect_group_id\)/);
    expect(migration0032).toMatch(
      /connect_group_has_membership_capacity\(m\.connect_group_id, m\.id\)/,
    );
  });

  it("revokes EXECUTE from public and anon; grants authenticated", () => {
    expect(migration0032).toMatch(
      /revoke all on function public\.rerequest_connect_group_membership\(uuid, text\) from public/,
    );
    expect(migration0032).toMatch(
      /revoke all on function public\.rerequest_connect_group_membership\(uuid, text\) from anon/,
    );
    expect(migration0032).toMatch(
      /grant execute on function public\.rerequest_connect_group_membership\(uuid, text\) to authenticated/,
    );
  });

  it("does not create staff reinstate or generic status RPC", () => {
    expect(migration0032).not.toMatch(
      /create or replace function public\.\w*reinstate\w*/i,
    );
    expect(migration0032).not.toMatch(/p_new_status/);
    expect(migration0032).not.toMatch(/set_connect_group_member_status/);
  });

  it("extends before-update for terminal→PENDING without removing ACTIVE→LEFT", () => {
    expect(migration0032).toMatch(/old\.status = 'ACTIVE'/);
    expect(migration0032).toMatch(/new\.status = 'LEFT'/);
    expect(migration0032).toMatch(/new\.status = 'PENDING'/);
    expect(migration0032).toMatch(/members cannot modify moderation fields/);
  });
});

describe("I-B5 action security (static)", () => {
  it("checks email confirmation, rate limit, and authenticated RPC write", () => {
    expect(actionsSrc).toMatch(/rerequestConnectGroupMembershipAction/);
    expect(actionsSrc).toMatch(/rerequest_connect_group_membership/);
    expect(actionsSrc).toMatch(/emailConfirmed/);
    expect(actionsSrc).toMatch(/cg-rerequest:/);
    expect(actionsSrc).toMatch(/writeAuditLog/);
    expect(actionsSrc).toMatch(/connect_group_member\.rerequest/);
    expect(actionsSrc).not.toMatch(/createServiceRoleClient/);
    expect(actionsSrc).toMatch(/Staff reinstate is intentionally not implemented/);
  });

  it("preserves I-B3 leave and I-B4 moderation RPCs", () => {
    expect(migration0029).toMatch(/leave_connect_group/);
    expect(migration0031).toMatch(/approve_connect_group_membership/);
    expect(migration0031).toMatch(/decline_connect_group_membership/);
    expect(migration0031).toMatch(/remove_connect_group_membership/);
    expect(actionsSrc).toMatch(/leave_connect_group/);
  });
});

describe("I-B5 UI (static)", () => {
  it("exposes re-request form for terminal statuses without admin fields", () => {
    expect(panelSrc).toMatch(/rerequestConnectGroupMembershipAction/);
    expect(panelSrc).toMatch(/Request to Join Again/);
    expect(panelSrc).not.toMatch(/admin_note/);
    expect(panelSrc).not.toMatch(/decided_by/);
    expect(panelSrc).not.toMatch(/[Rr]einstate/);
  });
});
