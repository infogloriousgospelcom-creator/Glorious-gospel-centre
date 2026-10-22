import "server-only";
import { createClient } from "@/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/supabase/admin";
import type { ServeInterestStatus } from "@/lib/ministry-serve-interest";

export type AdminServeInterestRow = {
  id: string;
  profile_id: string;
  ministry_id: string | null;
  status: ServeInterestStatus;
  member_note: string | null;
  staff_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  member_full_name: string | null;
  ministry_name: string | null;
};

const ADMIN_SELECT =
  "id,profile_id,ministry_id,status,member_note,staff_note,reviewed_by,reviewed_at,created_at,updated_at";

async function assertServeInterestManager(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;
    const { data: allowed } = await supabase.rpc("has_permission", {
      permission_key: "serve_interests.manage",
    });
    return Boolean(allowed);
  } catch {
    return false;
  }
}

async function attachLabels(rows: Omit<AdminServeInterestRow, "member_full_name" | "ministry_name">[]): Promise<AdminServeInterestRow[]> {
  if (rows.length === 0) return [];
  const supabase = createServiceRoleClient();
  const profileIds = [...new Set(rows.map((r) => r.profile_id))];
  const ministryIds = [...new Set(rows.map((r) => r.ministry_id).filter((id): id is string => Boolean(id)))];

  const names = new Map<string, string | null>();
  const ministries = new Map<string, string>();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,full_name")
    .in("id", profileIds);
  for (const p of profiles ?? []) names.set(p.id, p.full_name);

  if (ministryIds.length > 0) {
    const { data: mins } = await supabase
      .from("ministries")
      .select("id,name")
      .in("id", ministryIds);
    for (const m of mins ?? []) ministries.set(m.id, m.name);
  }

  return rows.map((r) => ({
    ...r,
    member_full_name: names.get(r.profile_id) ?? null,
    ministry_name: r.ministry_id ? (ministries.get(r.ministry_id) ?? null) : null,
  }));
}

export async function listServeInterestsForAdmin(input: {
  status?: string;
  ministryId?: string;
}): Promise<AdminServeInterestRow[]> {
  if (!(await assertServeInterestManager())) return [];
  if (!isServiceRoleConfigured()) return [];
  try {
    const supabase = createServiceRoleClient();
    let q = supabase
      .from("ministry_serve_interests")
      .select(ADMIN_SELECT)
      .order("created_at", { ascending: false });
    if (input.status && input.status !== "all") {
      q = q.eq("status", input.status);
    }
    if (input.ministryId && input.ministryId !== "all") {
      q = q.eq("ministry_id", input.ministryId);
    }
    const { data, error } = await q;
    if (error || !data) return [];
    return attachLabels(data as Omit<AdminServeInterestRow, "member_full_name" | "ministry_name">[]);
  } catch {
    return [];
  }
}

export async function getServeInterestForAdmin(id: string): Promise<AdminServeInterestRow | null> {
  if (!(await assertServeInterestManager())) return null;
  if (!isServiceRoleConfigured()) return null;
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("ministry_serve_interests")
      .select(ADMIN_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const [row] = await attachLabels([
      data as Omit<AdminServeInterestRow, "member_full_name" | "ministry_name">,
    ]);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function countServeInterestsByStatus(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {
    all: 0,
    NEW: 0,
    CONTACTED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    CLOSED: 0,
  };
  if (!(await assertServeInterestManager())) return counts;
  if (!isServiceRoleConfigured()) return counts;
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("ministry_serve_interests")
      .select("status");
    if (error || !data) return counts;
    counts.all = data.length;
    for (const row of data) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  } catch {
    return counts;
  }
}

export async function listMinistriesForServeFilter(): Promise<Array<{ id: string; name: string }>> {
  if (!(await assertServeInterestManager())) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ministries")
      .select("id,name")
      .eq("status", "PUBLISHED")
      .order("name", { ascending: true });
    if (error) return [];
    return (data ?? []) as Array<{ id: string; name: string }>;
  } catch {
    return [];
  }
}
