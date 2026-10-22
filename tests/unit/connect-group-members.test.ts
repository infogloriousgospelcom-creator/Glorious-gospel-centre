import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONNECT_GROUP_MEMBER_STATUSES,
  isConnectGroupMemberStatus,
  isOccupyingMembershipStatus,
  MEMBER_MEMBERSHIP_INSERT_COLUMNS,
  MEMBER_MEMBERSHIP_PUBLIC_COLUMNS,
  MEMBERSHIP_INSERT_FORBIDDEN_COLUMNS,
} from "@/lib/connect-group-members";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/0028_connect_group_members.sql",
);
const sql = readFileSync(migrationPath, "utf8");

describe("I-B2 connect_group_members migration", () => {
  it("defines the membership status enum with exact states", () => {
    expect(sql).toMatch(/create type public\.connect_group_member_status as enum/);
    for (const status of CONNECT_GROUP_MEMBER_STATUSES) {
      expect(sql).toContain(`'${status}'`);
    }
    expect(CONNECT_GROUP_MEMBER_STATUSES).toEqual([
      "PENDING",
      "ACTIVE",
      "DECLINED",
      "LEFT",
      "REMOVED",
    ]);
  });

  it("creates connect_group_members with FKs and unique membership", () => {
    expect(sql).toMatch(/create table if not exists public\.connect_group_members/);
    expect(sql).toMatch(
      /connect_group_id uuid not null references public\.connect_groups\(id\) on delete cascade/,
    );
    expect(sql).toMatch(
      /profile_id uuid not null references public\.profiles\(id\) on delete cascade/,
    );
    expect(sql).toMatch(
      /decided_by uuid references public\.profiles\(id\) on delete set null/,
    );
    expect(sql).toMatch(
      /constraint connect_group_members_unique_member unique \(connect_group_id, profile_id\)/,
    );
  });

  it("creates expected indexes", () => {
    expect(sql).toMatch(/idx_connect_group_members_group/);
    expect(sql).toMatch(/idx_connect_group_members_profile/);
    expect(sql).toMatch(/idx_connect_group_members_status/);
    expect(sql).toMatch(/idx_connect_group_members_group_status/);
    expect(sql).toMatch(/\(connect_group_id, status\)/);
  });

  it("reuses tg_set_updated_at", () => {
    expect(sql).toMatch(/execute function public\.tg_set_updated_at\(\)/);
  });

  it("seeds connect_groups.members.manage for SUPER_ADMIN and ADMIN", () => {
    expect(sql).toMatch(/'connect_groups\.members\.manage'/);
    expect(sql).toMatch(/key = 'SUPER_ADMIN'/);
    expect(sql).toMatch(/key = 'ADMIN'/);
  });

  it("does not create leaders table or global MEMBER role", () => {
    expect(sql).not.toMatch(/connect_group_leaders/);
    expect(sql).not.toMatch(/'MEMBER'/);
    expect(sql).not.toMatch(/'GROUP_LEADER'/);
  });
});

describe("I-B2 RLS and grants (static)", () => {
  it("enables RLS and denies anon via revoke + no anon policies", () => {
    expect(sql).toMatch(/alter table public\.connect_group_members enable row level security/);
    expect(sql).toMatch(
      /revoke all on table public\.connect_group_members from anon, authenticated/,
    );
    expect(sql).not.toMatch(/to anon,/);
    expect(sql).not.toMatch(/grant .+ to anon/);
  });

  it("defines self SELECT and PENDING-only self INSERT", () => {
    expect(sql).toMatch(/connect_group_members_self_select/);
    expect(sql).toMatch(/using \(profile_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/connect_group_members_self_insert/);
    expect(sql).toMatch(/status = 'PENDING'::public\.connect_group_member_status/);
    expect(sql).toMatch(/connect_group_is_open_for_join\(connect_group_id\)/);
  });

  it("does not grant member UPDATE/DELETE policies", () => {
    expect(sql).not.toMatch(/connect_group_members_self_update/);
    expect(sql).not.toMatch(/connect_group_members_self_delete/);
  });

  it("defines admin CRUD via connect_groups.members.manage", () => {
    expect(sql).toMatch(/has_permission\('connect_groups\.members\.manage'\)/);
    expect(sql).toMatch(/connect_group_members_admin_select/);
    expect(sql).toMatch(/connect_group_members_admin_insert/);
    expect(sql).toMatch(/connect_group_members_admin_update/);
    expect(sql).toMatch(/connect_group_members_admin_delete/);
  });

  it("hides admin_note and decided_by from member SELECT grants", () => {
    const selectGrant = sql.match(
      /grant select \(([\s\S]*?)\) on table public\.connect_group_members to authenticated/,
    );
    expect(selectGrant).toBeTruthy();
    const cols = selectGrant![1];
    expect(cols).not.toMatch(/\badmin_note\b/);
    expect(cols).not.toMatch(/\bdecided_by\b/);
    for (const col of MEMBER_MEMBERSHIP_PUBLIC_COLUMNS) {
      expect(cols).toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it("grants INSERT only on member-request columns", () => {
    const insertGrants = [
      ...sql.matchAll(
        /grant insert \(([\s\S]*?)\) on table public\.connect_group_members to authenticated/g,
      ),
    ];
    expect(insertGrants.length).toBe(1);
    const cols = insertGrants[0]![1];
    for (const col of MEMBER_MEMBERSHIP_INSERT_COLUMNS) {
      expect(cols).toMatch(new RegExp(`\\b${col}\\b`));
    }
    for (const col of MEMBERSHIP_INSERT_FORBIDDEN_COLUMNS) {
      expect(cols).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it("does not grant UPDATE or DELETE to authenticated", () => {
    expect(sql).not.toMatch(
      /grant update[\s\S]*on table public\.connect_group_members to authenticated/i,
    );
    expect(sql).not.toMatch(
      /grant delete[\s\S]*on table public\.connect_group_members to authenticated/i,
    );
    expect(sql).toMatch(/Intentionally NOT granted to authenticated/);
  });

  it("keeps admin RLS policies for permission-gated visibility", () => {
    expect(sql).toMatch(/connect_group_members_admin_select/);
    expect(sql).toMatch(/service-role path AFTER has_permission/);
  });
});

describe("I-B2 eligibility and capacity (static)", () => {
  it("requires OPEN + published_at for congregant joins", () => {
    expect(sql).toMatch(/connect_group_is_open_for_join/);
    expect(sql).toMatch(/g_status = 'OPEN'::public\.connect_group_status/);
    expect(sql).toMatch(/g_published is not null/);
    expect(sql).toMatch(/group is not open for membership requests/);
  });

  it("enforces capacity with FOR UPDATE and PENDING+ACTIVE occupancy", () => {
    expect(sql).toMatch(/connect_group_has_membership_capacity/);
    expect(sql).toMatch(/for update/);
    expect(sql).toMatch(/'PENDING'::public\.connect_group_member_status/);
    expect(sql).toMatch(/'ACTIVE'::public\.connect_group_member_status/);
    expect(sql).toMatch(/group is at capacity/);
    expect(sql).toMatch(/g_status = 'FULL'::public\.connect_group_status/);
  });

  it("blocks members from inserting ACTIVE or other statuses", () => {
    expect(sql).toMatch(/members may only create PENDING requests/);
    expect(sql).toMatch(/cannot create membership for another profile/);
  });

  it("documents email verification deferred to I-B3 server actions", () => {
    expect(sql).toMatch(/Email confirmation is enforced in Phase I-B3/);
  });
});

describe("I-B2 membership helpers", () => {
  it("recognizes statuses and occupying seats", () => {
    expect(isConnectGroupMemberStatus("PENDING")).toBe(true);
    expect(isConnectGroupMemberStatus("BOGUS")).toBe(false);
    expect(isOccupyingMembershipStatus("PENDING")).toBe(true);
    expect(isOccupyingMembershipStatus("ACTIVE")).toBe(true);
    expect(isOccupyingMembershipStatus("LEFT")).toBe(false);
  });
});
