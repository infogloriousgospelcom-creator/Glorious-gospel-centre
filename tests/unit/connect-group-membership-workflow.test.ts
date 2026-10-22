import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  JoinConnectGroupSchema,
  LeaveConnectGroupSchema,
  membershipJoinBlockedMessage,
} from "@/lib/connect-group-membership-schema";
import {
  MEMBERSHIP_INSERT_FORBIDDEN_COLUMNS,
  membershipStatusLabel,
} from "@/lib/connect-group-members";
import { safeMemberRedirect } from "@/lib/auth-redirects";

const migration0029 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0029_leave_connect_group.sql"),
  "utf8",
);
const migration0028 = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0028_connect_group_members.sql"),
  "utf8",
);
const joinActionSrc = readFileSync(
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

describe("I-B3 join schema", () => {
  it("accepts a valid join payload without client status/profile", () => {
    const r = JoinConnectGroupSchema.safeParse({
      connect_group_id: "11111111-1111-4111-8111-111111111111",
      member_note: "Looking forward to fellowship",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid group id", () => {
    expect(
      JoinConnectGroupSchema.safeParse({ connect_group_id: "not-a-uuid" }).success,
    ).toBe(false);
  });

  it("rejects oversized member notes", () => {
    expect(
      JoinConnectGroupSchema.safeParse({
        connect_group_id: "11111111-1111-4111-8111-111111111111",
        member_note: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("documents duplicate-history policy messages", () => {
    expect(membershipJoinBlockedMessage("PENDING")).toMatch(/pending/i);
    expect(membershipJoinBlockedMessage("ACTIVE")).toMatch(/already a member/i);
    expect(membershipJoinBlockedMessage("DECLINED")).toMatch(/declined/i);
    expect(membershipJoinBlockedMessage("LEFT")).toMatch(/left/i);
    expect(membershipJoinBlockedMessage("REMOVED")).toMatch(/ended/i);
  });
});

describe("I-B3 leave schema + RPC", () => {
  it("requires a membership uuid", () => {
    expect(LeaveConnectGroupSchema.safeParse({ membership_id: "" }).success).toBe(false);
    expect(
      LeaveConnectGroupSchema.safeParse({
        membership_id: "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(true);
  });

  it("defines leave_connect_group with ownership and ACTIVE→LEFT only", () => {
    expect(migration0029).toMatch(/create or replace function public\.leave_connect_group/);
    expect(migration0029).toMatch(/auth\.uid\(\)/);
    expect(migration0029).toMatch(/profile_id is distinct from auth\.uid\(\)/);
    expect(migration0029).toMatch(/ACTIVE'::public\.connect_group_member_status/);
    expect(migration0029).toMatch(/LEFT'::public\.connect_group_member_status/);
    expect(migration0029).toMatch(/left_at = coalesce/);
    expect(migration0029).toMatch(/grant execute on function public\.leave_connect_group/);
    const leaveFn = migration0029.slice(
      migration0029.indexOf("create or replace function public.leave_connect_group"),
    );
    expect(leaveFn).not.toMatch(/set[\s\S]*admin_note/i);
    expect(leaveFn).toMatch(/No admin fields/);
  });

  it("allows member leave in before-update guard without opening arbitrary updates", () => {
    expect(migration0029).toMatch(/old\.status = 'ACTIVE'/);
    expect(migration0029).toMatch(/new\.status = 'LEFT'/);
    expect(migration0029).toMatch(/members cannot modify moderation fields/);
  });
});

describe("I-B3 join action security (static)", () => {
  it("requires verified email and session-derived profile", () => {
    expect(joinActionSrc).toMatch(/emailConfirmed/);
    expect(joinActionSrc).toMatch(/verify your email address before joining/i);
    expect(joinActionSrc).toMatch(/profile_id: user\.userId/);
    expect(joinActionSrc).toMatch(/status: "PENDING"/);
    expect(joinActionSrc).not.toMatch(/formData\.get\(["']profile_id["']\)/);
    expect(joinActionSrc).not.toMatch(/formData\.get\(["']status["']\)/);
  });

  it("does not use service-role for member join/leave", () => {
    expect(joinActionSrc).not.toMatch(/createServiceRoleClient/);
    expect(joinActionSrc).toMatch(/leave_connect_group/);
  });

  it("handles duplicates and eligibility messaging", () => {
    expect(joinActionSrc).toMatch(/membershipJoinBlockedMessage/);
    expect(joinActionSrc).toMatch(/status !== "OPEN"/);
    expect(joinActionSrc).toMatch(/isUniqueViolation/);
  });

  it("documents no PENDING withdrawal in I-B3", () => {
    expect(joinActionSrc).toMatch(/PENDING withdrawal is not implemented/);
  });
});

describe("I-B3 grants remain least-privilege", () => {
  it("0028 still withholds UPDATE/DELETE and moderation INSERT columns", () => {
    expect(migration0028).not.toMatch(
      /grant update[\s\S]*on table public\.connect_group_members to authenticated/i,
    );
    expect(migration0028).not.toMatch(
      /grant delete[\s\S]*on table public\.connect_group_members to authenticated/i,
    );
    const insertGrant = migration0028.match(
      /grant insert \(([\s\S]*?)\) on table public\.connect_group_members to authenticated/,
    );
    expect(insertGrant).toBeTruthy();
    for (const col of MEMBERSHIP_INSERT_FORBIDDEN_COLUMNS) {
      expect(insertGrant![1]).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
  });
});

describe("I-B3 UI + redirects", () => {
  it("sends anonymous users to login with safe connect return path", () => {
    expect(panelSrc).toMatch(/\/login\?redirect_to=/);
    expect(safeMemberRedirect("/connect/youth-fellowship")).toBe("/connect/youth-fellowship");
    expect(safeMemberRedirect("https://evil.com")).toBeNull();
  });

  it("shows join / pending / member leave states", () => {
    expect(panelSrc).toMatch(/Request to Join/);
    expect(panelSrc).toMatch(/Request pending/);
    expect(panelSrc).toMatch(/Leave Group/);
    expect(panelSrc).toMatch(/window\.confirm/);
  });

  it("labels membership statuses for members", () => {
    expect(membershipStatusLabel("PENDING")).toBe("Request pending");
    expect(membershipStatusLabel("ACTIVE")).toBe("Member");
  });
});
