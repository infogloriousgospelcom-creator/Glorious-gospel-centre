import "server-only";
import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import {
  isConnectGroupMemberStatus,
  type ConnectGroupMemberStatus,
} from "@/lib/connect-group-members";

const ADMIN_MEMBERSHIP_SELECT =
  "id,connect_group_id,profile_id,status,requested_at,decided_at,decided_by,left_at,member_note,admin_note,created_at,updated_at";

export type ConnectGroupMembershipAdminRow = {
  id: string;
  connect_group_id: string;
  profile_id: string;
  status: ConnectGroupMemberStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  left_at: string | null;
  member_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  member_full_name: string | null;
  decided_by_full_name: string | null;
};

async function assertMembersManagerForRead(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;
    const { data: allowed } = await supabase.rpc("has_permission", {
      permission_key: "connect_groups.members.manage",
    });
    return Boolean(allowed);
  } catch {
    return false;
  }
}

type RawMembership = {
  id: string;
  connect_group_id: string;
  profile_id: string;
  status: string;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  left_at: string | null;
  member_note: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

async function attachProfileNames(
  rows: RawMembership[],
): Promise<ConnectGroupMembershipAdminRow[]> {
  if (rows.length === 0) return [];
  const ids = new Set<string>();
  for (const r of rows) {
    ids.add(r.profile_id);
    if (r.decided_by) ids.add(r.decided_by);
  }
  const supabase = createServiceRoleClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", [...ids]);
  const nameById = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameById.set(p.id as string, (p.full_name as string | null) ?? null);
  }
  return rows
    .filter((r) => isConnectGroupMemberStatus(r.status))
    .map((r) => ({
      ...r,
      status: r.status as ConnectGroupMemberStatus,
      member_full_name: nameById.get(r.profile_id) ?? null,
      decided_by_full_name: r.decided_by
        ? (nameById.get(r.decided_by) ?? null)
        : null,
    }));
}

export async function listMembershipsForGroupAdmin(input: {
  connectGroupId: string;
  status?: string;
}): Promise<ConnectGroupMembershipAdminRow[]> {
  if (!(await assertMembersManagerForRead())) return [];
  if (!isServiceRoleConfigured()) return [];
  try {
    const supabase = createServiceRoleClient();
    let q = supabase
      .from("connect_group_members")
      .select(ADMIN_MEMBERSHIP_SELECT)
      .eq("connect_group_id", input.connectGroupId);
    if (input.status && input.status !== "all" && isConnectGroupMemberStatus(input.status)) {
      q = q.eq("status", input.status);
    }
    q = q
      .order("requested_at", { ascending: false })
      .order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error || !data) return [];
    return attachProfileNames(data as RawMembership[]);
  } catch {
    return [];
  }
}

export async function countMembershipsByStatusForGroup(
  connectGroupId: string,
): Promise<Record<ConnectGroupMemberStatus | "all", number>> {
  const counts: Record<ConnectGroupMemberStatus | "all", number> = {
    all: 0,
    PENDING: 0,
    ACTIVE: 0,
    DECLINED: 0,
    LEFT: 0,
    REMOVED: 0,
  };
  if (!(await assertMembersManagerForRead())) return counts;
  if (!isServiceRoleConfigured()) return counts;
  try {
    const rows = await listMembershipsForGroupAdmin({
      connectGroupId,
      status: "all",
    });
    counts.all = rows.length;
    for (const r of rows) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  } catch {
    return counts;
  }
}
